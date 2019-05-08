import Flow from '../../index';

interface Stack {
  type: string;
  id: string;
  time: number;
}

export default async function syncInvokeTrigger (flow: Flow, index: number, data: {
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
  flow.logger.debug('syncInvokeTrigger: begin %i %o', index, data);

  const result: {
    event: any;
    context: any;
  } = data;

  if (index < 0) {
    for (let i = 0; i < flow.steps.length; i++) {
      result.event = await flow.invoke(i, result);
    }
  } else {
    result.event = await flow.invoke(index, result);
  }

  flow.logger.debug('syncInvokeTrigger: end %o', result);

  return result.event;
}
