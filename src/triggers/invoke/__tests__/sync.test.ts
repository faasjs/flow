import Flow from '../../../index';

describe('trigger.syncInvoke', function () {
  const flow = new Flow(
    {},
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
    [undefined, 6],
    [-1, 6],
    [0, 1],
    [1, 2],
    [2, 3],
  ])('index is %s', async function (index, result) {
    const res = await flow.createTrigger(index)(0, {});

    expect(res).toEqual(result);
  });
});
