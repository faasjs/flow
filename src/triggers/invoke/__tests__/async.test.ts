import Flow from '../../../index';

describe('trigger.asyncInvoke', function () {
  const flow = new Flow(
    {
      mode: 'async',
      resource: {
        handler: () => 1
      }
    },
    function (prev: any) {
      return prev + 1;
    },
    function (prev: any) {
      return prev + 2;
    },
    function (prev: any) {
      return prev + 3;
    },
  );

  test.each([
    [-1, 1],
    [0, 1],
    [1, 2],
    [2, 3],
  ])('index is %s', async function (index, result) {
    const res = await flow.createTrigger(index)(0, {});

    expect(res).toEqual(result);
  });
});
