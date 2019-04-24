import { Logger } from '@faasjs/utils';

interface IConfig {
  mode?: string;
  triggers?: any;
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
   * @param args {step[]} 步骤数组
   */
  constructor(config: IConfig, ...args: any) {
    if (!args.length) {
      throw Error('不能创建空流程');
    }

    this.config = config;

    if (!this.config.mode) {
      this.config.mode = 'sync';
    }

    this.steps = Array.from(args);
    this.currentStepIndex = -1;
    this.logger = new Logger('@faasjs/flow');
  }

  public async trigger(type: string, event: any, context: any) {
    this.logger.debug('trigger %s with %o %o', type, event, context);

    this.currentStepIndex = -1;

    let lastResult: any;

    switch (type) {
      case 'http':
        lastResult = await this.httpTrigger(event, context);
        break;
    }

    return lastResult;
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

  private async httpTrigger(event: any, context: any) {
    this.logger.debug('httpTrigger %o %o', event, context);

    // 预处理输入内容
    const input = {
      body: event.body || null,
      header: event.headers || {},
      query: event.queryString || {},
    };

    const outputHeaders = {
      'Content-Type': 'application/json; charset=UTF-8',
      // 'X-Request-Id': context.request_id
    };

    // 触发流程
    let output: any;
    if (this.config.mode === 'sync') {
      try {
        const results = await this.invoke(-1, input);
        output = results[this.currentStepIndex];
      } catch (error) {
        this.logger.error(error);

        // 预处理错误内容的格式
        if (error.body && typeof error.body !== 'string') {
          error.body = JSON.stringify(error.body);
        }

        if (error.statusCode && error.headers) {
          // 若 error 是一个 Response，则直接透传
          output = error;
        } else if (error.code && error.message) {
          // 若 Error 包含 code 和 message
          output = {
            body: JSON.stringify({ message: error.message }),
            headers: outputHeaders,
            statusCode: error.code,
          };
        } else {
          // 按默认错误格式返回
          output = {
            body: error.message || error.body,
            headers: outputHeaders,
            statusCode: 500,
          };
        }
      }
    } else if (this.config.mode === 'async') {
      await this.remoteInvoke(0, input);
      output = null;
    }

    // 处理结果并返回
    if (typeof output !== 'undefined' && output !== null) {
      return {
        body: JSON.stringify({ data: output }),
        headers: outputHeaders,
        statusCode: 200,
      };
    } else {
      return {
        headers: outputHeaders,
        statusCode: 201,
      };
    }
  }
}

export default Flow;
