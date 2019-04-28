import { Logger } from '@faasjs/utils';

interface IConfig {
  mode?: string;
  env?: {
    defaults: {
      [key: string]: any;
    };
    testing?: {
      [key: string]: any;
    };
    production?: {
      [key: string]: any;
    }
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
      }
    } | boolean;
  };
  resourceName?: string;
  resourceConfig?: {
    [key: string]: any;
  };
}

class Flow {
  public config: IConfig;
  public steps: any[];
  public logger: Logger;
  public currentStepIndex: number;

  /**
   * 新建流程
   * @param config {object} 配置项
   * @param config.mode {string} [config.mode=sync] 执行模式，默认为 sync 同步执行，支持 async 异步执行
   * @param config.triggers {object=} 触发器配置
   * @param config.env {object=} 环境变量，默认支持 defaults、testing 和 production
   * @param config.resourceName {string=} 云资源名
   * @param config.resourceConfig {object=} 云资源配置，将覆盖默认的云资源配置项
   * @param args {step[]} 步骤数组
   */
  constructor(config: IConfig, ...args: any) {
    this.logger = new Logger('@faasjs/flow');

    if (!args.length) {
      throw Error('Step required');
    }

    this.steps = Array.from(args);

    this.config = Object.assign({ mode: 'sync', triggers: {}, resourceConfig: {} }, config);

    this.currentStepIndex = -1;
  }

  public createTrigger(type: string, key?: any) {
    return async (event: any, context: any) => {
      this.logger.debug('trigger %s with %o %o', type, event, context);

      this.currentStepIndex = -1;

      let lastResult: any;

      switch (type) {
        case 'invoke':
          lastResult = await this.invokeTrigger(key, event, context);
          break;
        case 'http':
          lastResult = await this.httpTrigger(event, context);
          break;
      }

      return lastResult;
    };
  }

  public async invoke(index: number, prev: any) {
    this.logger.debug('invoke #%i with %o', index, prev);

    if (index < 0) {
      const results: any = {};
      let lastResult: any = prev;
      this.currentStepIndex = -1;

      for (let i = 0; i < this.steps.length; i++) {
        this.currentStepIndex = i;
        const result = await this.run(lastResult);

        results[i] = result;
        lastResult = result;
      }

      return results;
    } else {
      this.currentStepIndex = index;

      return await this.run(prev);
    }
  }

  public async remoteInvoke(index: number, prev: any) {
    this.logger.debug('remoteInvoke #%i with %o', index, prev);
  }

  private async run(prev: any) {
    this.logger.debug('run step#%i with %o', this.currentStepIndex, prev);

    const step = this.steps[this.currentStepIndex];

    let result;

    const type = Object.prototype.toString.call(step);

    switch (type) {
      case '[object Function]':
        try {
          result = await step.call(this, prev);
        } catch (error) {
          this.logger.error(error);
          result = error;
        }
        break;
      default:
        throw Error('Unknow step type: ' + type);
    }

    return result;
  }

  private async invokeTrigger(key: any, event: any, context: any) {
    this.logger.debug('invokeTrigger %o %o %o', key, event, context);

    // 触发流程
    let output: any;
    if (this.config.mode === 'sync') {
      const results = await this.invoke(-1, event);
      output = results[this.currentStepIndex];
    } else if (this.config.mode === 'async') {
      // 异步模式只执行第一个步骤
      output = await this.invoke(key, event);
      await this.remoteInvoke(key + 1, output);
    }

    // 处理结果并返回
    return output;
  }

  private async httpTrigger(event: any, context: any) {
    this.logger.debug('httpTrigger %o %o', event, context);

    // 预处理输入内容
    const input: {
      body: any;
      header: any;
      method: string;
      query: any;
      param: any;
    } = {
      body: event.body || null,
      header: event.headers || {},
      method: event.httpMethod || 'GET',
      param: {},
      query: event.queryString || {},
    };

    if (input.header['Content-Type'] && input.header['Content-Type'].includes('application/json')) {
      input.body = JSON.parse(input.body);
    }

    const outputHeaders = {
      'Content-Type': 'application/json; charset=UTF-8',
      // 'X-Request-Id': context.request_id
    };

    let output: any = null;

    // 输入项校验
    if (this.config.triggers && typeof this.config.triggers.http === 'object') {
      // 校验请求方法
      if (this.config.triggers.http.method && input.method !== this.config.triggers.http.method) {
        output = Error('Wrong method');
      }

      // 校验参数
      if (this.config.triggers.http.param) {
        for (const key in this.config.triggers.http.param) {
          if (this.config.triggers.http.param.hasOwnProperty(key)) {
            const config = this.config.triggers.http.param[key];

            // 默认从 body 中读取参数
            if (!config.position) {
              config.position = 'body';
            }

            // 必填项校验
            if (config.required &&
              (
                !input[config.position] ||
                typeof input[config.position][key] === 'undefined' ||
                input[config.position][key] === null
              )
            ) {
              output = Error(`${key} required`);
              break;
            }

            const value = input[config.position][key];

            // 将通过校验的数据存入 input.param
            input.param[key] = value;
          }
        }
      }
    }

    // 若输入项校验通过，则触发流程
    if (output === null) {
      if (this.config.mode === 'sync') {
        // 同步执行模式，执行全部步骤
        const results = await this.invoke(-1, input);
        output = results[this.currentStepIndex];
        this.logger.debug('result %o', output);
      } else if (this.config.mode === 'async') {
        // 异步模式，异步调用下一步，无返回
        await this.remoteInvoke(0, input);
        output = null;
      }
    }

    // 处理结果并返回
    if (typeof output === 'undefined' || output === null) {
      // 没有结果或结果内容为空时，直接返回 201
      output = {
        statusCode: 201,
      };
    } else if (output instanceof Error) {
      // 当结果是错误类型时
      output = {
        body: { error: { message: output.message } },
        statusCode: 500,
      };
    } else if (!output.statusCode) {
      output = {
        body: { data: output },
        statusCode: 200,
      };
    }

    // 注入公共响应头
    output.headers = Object.assign(output.headers || {}, outputHeaders);

    // 序列化 body
    if (typeof output.body !== 'string') {
      output.body = JSON.stringify(output.body);
    }

    // 返回响应
    this.logger.debug('response %o', output);
    return output;
  }
}

export default Flow;
