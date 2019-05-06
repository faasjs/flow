import { deepMerge, Logger } from '@faasjs/utils';

import { existsSync } from 'fs';
import asyncInvokeTrigger from './triggers/invoke/async';
import syncInvokeTrigger from './triggers/invoke/sync';

interface IResource {
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
    }
  };
}
interface IConfig {
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
    http?: {
      method?: string;
      path?: string;
      param?: {
        [key: string]: {
          position?: 'header' | 'query' | 'body';
          required?: boolean;
        };
      },
      resource?: IResource;
      handler?: (flow: Flow, trigger: any, data: {
        event: any;
        context: {
          history: IStack[];
          current: IStack;
        };
        orgin: {
          event: any;
          context: any;
        }
        [key: string]: any;
      }) => any;
    };
    [key: string]: any;
  };
  resource?: IResource;
}

interface IStack {
  type: string;
  id: string;
  time: number;
}

class Flow {
  public config: IConfig;
  public steps: any[];
  public logger: Logger;

  /**
   * 新建流程
   * @param config {object} 配置项
   * @param config.mode {string} [config.mode=sync] 执行模式，默认为 sync 同步执行，支持 async 异步执行
   * @param config.name {string=} 流程名，不设置时以 文件夹名/文件名 的形式作为流程名
   * @param config.triggers {object=} 触发器配置
   * @param config.env {object=} 环境变量，默认支持 defaults、testing 和 production
   * @param config.resource {IResource=} 云函数对应的云资源配置
   * @param args {step[]} 步骤数组
   */
  constructor(config: IConfig, ...args: any) {
    this.logger = new Logger('@faasjs/flow');

    if (!args.length) {
      throw Error('Step required');
    }

    // 检查步骤
    this.steps = [];
    for (let i = 0; i < args.length; i++) {
      if (!args[i]) {
        throw Error('Unknow step#' + i);
      } else if (typeof args[i] === 'function') {
        // 封装函数类步骤
        const step = Object.create(null);
        step.handler = args[i];
        this.steps.push(step);
      } else if (args[i].handler) {
        this.steps.push(args[i]);
      } else {
        throw Error(`Unknow step#${i}'s type`);
      }
    }

    this.config = deepMerge({ mode: 'sync', triggers: Object.create(null), resource: Object.create(null) }, config);

    // 检查触发器
    for (const key in this.config.triggers) {
      if (this.config.triggers.hasOwnProperty(key)) {
        const trigger = this.config.triggers[key];
        if (!trigger.resource) {
          trigger.resource = Object.create(null);
        }

        if (!trigger.handler) {
          const typePath = trigger.resource.type || key;
          const paths = [
            `${process.cwd()}/config/triggers/${typePath}/index.ts`,
            `${process.cwd()}/node_modules/@faasjs/trigger-${typePath}/lib/index.js`,
            `${process.cwd()}/node_modules/${typePath}/lib/index.js`,
            `${process.cwd()}/${typePath}/index.ts`,
          ];

          for (const path of paths) {
            if (existsSync(path)) {
              trigger.handler = require(path).default;
            }
          }

          if (!trigger.handler || typeof trigger.handler !== 'function') {
            throw Error(`Unknow trigger#${key}\nfind paths:\n${paths.join('\n')}`);
          }
        }
      }
    }
  }

  /**
   * 创建触发函数
   * @param type {string | number} 类型，若为数字则表示为触发第几步步骤
   */
  public createTrigger(type?: string | number) {
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
        const trigger = this.config.triggers![type];
        return await trigger.handler(this, trigger, processed);
      }
    };
  }

  /**
   * 立即执行步骤
   * @param index {number} 步骤次序
   * @param data {object} 数据
   */
  public async invoke(index: number, data: any) {
    this.logger.debug('invoke step#%i with %o', index, data);

    const step = this.steps[index];

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
  public async remoteInvoke(index: number, data: any) {
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
  protected async processOrigin({ type, event, context }: { type: string, event: any, context: any }):
    Promise<{
      context: {
        trackId: string;
        history: IStack[];
        current: IStack;
      },
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
