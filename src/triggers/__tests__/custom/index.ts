import Flow from '../../../index';

export default async function customTrigger(flow: Flow, trigger: any, data: {
  event: any;
  context: any;
  [key: string]: any;
}) {
  return true;
}
