import Flow from '../../index';

interface Stack {
  type: string;
  id: string;
  time: number;
}

export default async function asyncInvokeTrigger (flow: Flow, index: number, data: {
  event: any;
  context: {
    history: Stack[];
    current: Stack;
  };
  origin: {
    context: any;
    event: any;
  };
  [key: string]: any;
}) {
  flow.logger.debug('asyncInvokeTrigger: begin %i', index);

  // 异步模式下，-1 步骤改成仅执行第一步
  if (index < 0) {
    index = 0;
  }

  // 执行当前步骤
  data.event = await flow.invoke(index, data);

  // 异步触发后一个步骤
  if (flow.steps.length > index) {
    await flow.remoteInvoke(index + 1, data);
  }

  flow.logger.debug('asyncInvokeTrigger: end %o', data);
  return data.event;
}
