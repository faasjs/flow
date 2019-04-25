import Flow from '../index';

describe('invoke', function () {
  const flow = new Flow(
    {},
    function (prev: any) {
      return prev + 1;
    },
    function (prev: any) {
      return prev + 2;
    },
  );

  test('-1', async function () {
    const res = await flow.invoke(-1, 0);

    expect(res).toEqual({
      0: 1,
      1: 3,
    });
  });

  test('0', async function () {
    const res = await flow.invoke(0, 1);

    expect(res).toEqual(2);
  });

  test('1', async function () {
    const res = await flow.invoke(1, 2);

    expect(res).toEqual(4);
  });
});
