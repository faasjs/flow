import Flow from '../../index';
interface Stack {
    type: string;
    id: string;
    time: number;
}
export default function asyncInvokeTrigger(flow: Flow, index: number, data: {
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
}): Promise<any>;
export {};
