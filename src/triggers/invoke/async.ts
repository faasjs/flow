import Flow from '../../index';

interface IStack {
  type: string;
  id: string;
  time: number;
}

export default async function asyncInvokeTrigger(flow: Flow, index: number, data: {
  event: any;
  context: {
    history: IStack[];
    current: IStack;
  };
  origin: {
    context: any;
    event: any;
  };
  [key: string]: any;
}) {
  flow.logger.debug('asyncInvokeTrigger: begin %i %o', index, data);

  // 执行当前步骤
  data.event = await flow.invoke(index, data);

  // 异步触发后一个步骤
  if (flow.steps.length > index) {
    await flow.remoteInvoke(index + 1, data);
  }

  flow.logger.debug('asyncInvokeTrigger: end %o', data);
  return data.event;
}
