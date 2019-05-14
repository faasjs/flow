import deepMerge from '@faasjs/deep_merge';
import Logger from '@faasjs/logger';
import asyncInvokeTrigger from './triggers/invoke/async';
import syncInvokeTrigger from './triggers/invoke/sync';

interface Resource {
  name?: string;
  type?: string;
  config?: {
    [key: string]: any;
  };
  provider?: {
    name?: string;
    type?: string;
    config?: {
      [key: string]: any;
    };
  };
}

interface Trigger {
  resource?: Resource;
  handler?: (flow: Flow, trigger: any, data: {
    event: any;
    context: {
      history: Stack[];
      current: Stack;
    };
    origin: {
      event: any;
      context: any;
    };
    [key: string]: any;
  }) => any;
  [key: string]: any;
}

interface Config {
  mode?: string;
  name?: string;
  env?: {
    defaults: {
      [key: string]: any;
    };
    testing?: {
      [key: string]: any;
    };
    production?: {
      [key: string]: any;
    };
  };
  triggers?: {
    [key: string]: Trigger;
  };
  resource?: Resource;
}

interface Stack {
  type: string;
  id: string;
  time: number;
}

class Flow {
  public stagging: string;
  public config: Config;
  public steps: any[];
  public logger: Logger;

  /**
   * 新建流程
   * @param config {object} 配置项
   * @param config.mode {string} [config.mode=sync] 执行模式，默认为 sync 同步执行，支持 async 异步执行
   * @param config.name {string=} 流程名，不设置时以 文件夹名/文件名 的形式作为流程名
   * @param config.triggers {object=} 触发器配置
   * @param config.env {object=} 环境变量，默认支持 defaults、testing 和 production
   * @param config.resource {Resource=} 云函数对应的云资源配置
   * @param steps {step[]} 步骤数组
   */
  constructor (config: Config, ...steps: any) {
    this.logger = new Logger('@faasjs/flow');

    if (!steps.length) {
      throw Error('Step required');
    }

    this.stagging = process.env.stagging || 'testing';

    // 检查步骤
    this.steps = [];
    for (const step of steps) {
      if (!step) {
        throw Error('Unknow step#' + steps.indexOf(step));
      } else if (typeof step === 'function') {
        // 封装函数类步骤
        const stepObject = Object.create(null);
        stepObject.handler = step;
        this.steps.push(stepObject);
      } else if (step.handler) {
        this.steps.push(step);
      } else {
        throw Error(`Unknow step#${steps.indexOf(step)}'s type`);
      }
    }

    this.config = deepMerge({
      mode: 'sync',
      triggers: Object.create(null),
      resource: Object.create(null)
    }, config);

    // 检查触发器
    for (const key in this.config.triggers) {
      if (this.config.triggers.hasOwnProperty(key)) {
        const trigger = this.config.triggers[key as string];
        if (!trigger.resource) {
          trigger.resource = Object.create(null);
        }

        if (!trigger.handler) {
          const typePath = trigger.resource!.type || key;
          try {
            // eslint-disable-next-line security/detect-non-literal-require
            trigger.handler = require(`@faasjs/trigger-${typePath}`);
          } catch (e) {
            try {
              // eslint-disable-next-line security/detect-non-literal-require
              trigger.handler = require(typePath);
            } catch (e) {
              throw Error(`Unknow trigger: ${key} ${typePath}`);
            }
          }

          if (typeof trigger.handler !== 'function') {
            throw Error(`Unknow trigger: ${key} ${typePath}`);
          }
        }
      }
    }
  }

  /**
   * 创建触发函数
   * @param type {string | number} 类型，若为数字则表示为触发第几步步骤
   */
  public createTrigger (type?: string | number) {
    return async (event: any, context: any) => {
      // type 未定义或为数字时，强制为 invoke 类型
      let index = -1;
      if (typeof type === 'undefined' || type === null) {
        type = 'invoke';
      } else if (typeof type === 'number') {
        index = type;
        type = 'invoke';
      }
      // 记录原始数据
      const origin = {
        context,
        event,
        type,
      };
      this.logger.debug('%s: %i %o', type, index, origin);

      // 处理服务商原始数据
      const processed = await this.processOrigin(origin);

      this.logger.debug('processed: %o', processed);
      this.logger.label = processed.context.trackId;

      // 执行步骤
      if (type === 'invoke') {
        // invoke 触发时，使用内置触发器
        if (this.config.mode === 'sync') {
          return await syncInvokeTrigger(this, index, processed);
        } else {
          return await asyncInvokeTrigger(this, index, processed);
        }
      } else {
        const trigger: Trigger = this.config.triggers![type as string];
        return await trigger.handler!(this, trigger, processed);
      }
    };
  }

  /**
   * 立即执行步骤
   * @param index {number} 步骤次序
   * @param data {object} 数据
   */
  public async invoke (index: number, data: any) {
    this.logger.debug('invoke step#%i with %o', index, data);

    const step = this.steps[index as number];

    if (!step) {
      throw Error(`step#${index} not found.`);
    }

    if (!step.handler || typeof step.handler !== 'function') {
      throw Error(`step#${index}'s handler not found.`);
    }

    let result;

    try {
      result = await step.handler.call(data, data.event, data.context);
    } catch (error) {
      this.logger.error(error);
      result = error;
    }

    return result;
  }

  /**
   * 异步远程执行步骤
   * @param index {number} 步骤次序
   * @param data {object} 数据
   */
  public async remoteInvoke (index: number, data: any) {
    this.logger.debug('remoteInvoke: #%i with %o', index, data);

    this.logger.error('remoteInvoke: no provider found');
  }

  /**
   * 处理原始数据
   * @param origin {object} 原始数据
   * @param origin.type {string} 触发类型
   * @param origin.event {object} 事件数据
   * @param origin.context {object} 环境数据
   */
  protected async processOrigin ({ type, event, context }: { type: string; event: any; context: any }):
  Promise<{
    context: {
      trackId: string;
      history: Stack[];
      current: Stack;
    };
    event: any;
    origin: {
      context: any;
      event: any;
      type: string;
    };
    type: string;
  }> {
    this.logger.warn('processOrigin: no provider found');

    return {
      context: {
        current: {
          id: new Date().getTime().toString(),
          time: new Date().getTime(),
          type,
        },
        history: [],
        trackId: new Date().getTime().toString(),
      },
      event,
      origin: {
        context,
        event,
        type,
      },
      type,
    };
  }
}

export default Flow;
