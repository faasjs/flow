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
  handler?: (...args: any) => any;
}

interface Trigger {
  resource?: Resource;
  handler?: (flow: Flow, trigger: any, data: {
    event: any;
    context: {
      trackId: string;
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

interface Stack {
  type: string;
  id: string;
  time: number;
}

class Flow {
  public mode: string;
  public name?: string;
  public resource: Resource;
  public triggers: {
    [key: string]: Trigger;
  }
  public resources: {
    [key: string]: Resource;
  }
  public steps: any[];
  public logger: Logger;
  public mounted: boolean;
  public helpers: {
    [key: string]: any;
  };

  /**
   * 新建流程
   * @param config {object} 配置项
   * @param config.mode {string} [config.mode=sync] 执行模式，默认为 sync 同步执行，支持 async 异步执行
   * @param config.name {string=} 流程名，不设置时以 文件夹名/文件名 的形式作为流程名
   * @param config.triggers {object=} 触发器配置
   * @param config.resources {object=} 额外引用的云资源
   * @param config.env {object=} 环境变量，默认支持 defaults、testing 和 production
   * @param config.resource {Resource=} 云函数对应的云资源配置
   * @param steps {step[]} 步骤数组
   */
  constructor (config: {
    mode?: string;
    name?: string;
    triggers?: {
      [key: string]: Trigger;
    };
    resource?: Resource;
    resources?: {
      [key: string]: Resource;
    };
  }, ...steps: any) {
    this.logger = new Logger('@faasjs/flow');

    if (!steps.length) {
      throw Error('Step required');
    }

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

    this.mode = config.mode || 'sync';
    this.name = config.name;
    this.resource = config.resource || Object.create(null);
    this.triggers = config.triggers || Object.create(null);
    this.resources = config.resources || Object.create(null);

    this.mounted = false;
    this.helpers = Object.create(null);
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

      this.onMounted();

      // 处理服务商原始数据
      const processed = await this.processOrigin(origin);

      this.logger.debug('processed: %o', processed);
      this.logger.label = processed.context.trackId;

      // 执行步骤
      if (type === 'invoke') {
        // invoke 触发时，使用内置触发器
        if (this.mode === 'sync') {
          return await syncInvokeTrigger(this, index, processed);
        } else {
          return await asyncInvokeTrigger(this, index, processed);
        }
      } else {
        const trigger: Trigger = this.triggers![type as string];
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
    this.logger.debug('invoke step#%i', index);

    const step = this.steps[index as number];

    if (!step) {
      throw Error(`Step#${index} not found`);
    }

    let result;

    try {
      this.helpers!._event = data.event;
      this.helpers!._context = data.context;
      result = await step.handler.call(this.helpers, data.event, data.context);
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
    this.logger.debug('remoteInvoke: #%i', index);

    this.logger.error('remoteInvoke: no provider found');
  }

  /**
   * 处理原始数据
   * @param origin {object} 原始数据
   * @param origin.type {string} 触发类型
   * @param origin.event {object} 事件数据
   * @param origin.context {object} 环境数据
   */
  public async processOrigin ({ type, event, context }: { type: string; event: any; context: any }):
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

  /**
   * 容器实例创建时进行容器实例的初始化
   */
  public onMounted () {
    if (!this.mounted) {
      this.logger.debug('onMounted begin');

      // 加载云函数
      if (!this.resource.handler) {
        if (!this.resource!.type) {
          throw Error('Unknow resource type');
        }
        let typePath = this.resource.type;
        try {
          // eslint-disable-next-line security/detect-non-literal-require
          this.resource.handler = require(`@faasjs/provider-${typePath}`).handler;
        } catch (e) {
          try {
            // eslint-disable-next-line security/detect-non-literal-require
            this.resource.handler = require(typePath).handler;
          } catch (e) {
            throw Error(`Unknow resource: ${typePath}`);
          }
        }
      }

      if (typeof this.resource.handler !== 'function') {
        throw Error(`Resource#function<${this.resource.type}> is not a function`);
      }

      this.resource.handler(this.resource, this);

      this.logger.debug('Resource#function mounted');

      // 加载触发器
      for (const key in this.triggers) {
        if (this.triggers.hasOwnProperty(key)) {
          const trigger = this.triggers[key as string];

          if (!trigger.handler) {
            const typePath = trigger.triggerType || trigger.type || key;
            try {
              // eslint-disable-next-line security/detect-non-literal-require
              trigger.handler = require(`@faasjs/trigger-${typePath}`).handler;
            } catch (e) {
              try {
                // eslint-disable-next-line security/detect-non-literal-require
                trigger.handler = require(typePath).handler;
              } catch (e) {
                throw Error(`Unknow trigger: ${key} ${typePath}`);
              }
            }
          }

          if (typeof trigger.handler !== 'function') {
            throw Error(`Trigger#${key}<${trigger.triggerType || trigger.type}> is not a function`);
          }

          this.logger.debug(`Trigger#${key} mounted`);
        }
      }

      // 加载云资源
      for (const key in this.resources) {
        if (this.resources.hasOwnProperty(key)) {
          const resource = this.resources[key as string];

          if (!resource.handler) {
            const typePath = resource.type || key;
            try {
              // eslint-disable-next-line security/detect-non-literal-require
              resource.handler = require(`@faasjs/provider-${typePath}`).handler;
            } catch (e) {
              try {
                // eslint-disable-next-line security/detect-non-literal-require
                resource.handler = require(typePath).handler;
              } catch (e) {
                throw Error(`Unknow resource: ${key} ${typePath}`);
              }
            }
          }

          if (typeof resource.handler !== 'function') {
            throw Error(`Resource#${key}<${resource.type}> is not a function`);
          }

          this.logger.debug(`Resource#${key} mounted`);
        }
      }

      // 生成 helpers
      this.helpers.logger = this.logger;
      for (const key in this.resources) {
        if (this.resources.hasOwnProperty(key)) {
          const resource = this.resources[key as string];
          this.helpers[key as string] = resource.handler!(resource, this);
          this.logger.debug(`Helper#${key} mounted`);
        }
      }
    }
    this.mounted = true;
    this.logger.debug('onMounted done');
  }
}

export default Flow;
