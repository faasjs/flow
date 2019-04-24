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

describe('triggers', function () {
  describe('http', function () {
    describe('basic', function () {
      test('sync mode', async function () {
        const flow = new Flow(
          {
            triggers: {
              http: true,
            },
          },
          function (prev: any) {
            return prev.query.n + 1;
          },
          function (prev: any) {
            return prev + 2;
          },
        );

        const res = await flow.trigger('http', { queryString: { n: 0 } }, {});

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual('{"data":3}');
      });

      test('async mode', async function () {
        const flow = new Flow(
          {
            mode: 'async',
            triggers: {
              http: true,
            },
          },
          function (prev: any) {
            return prev.query.n + 1;
          },
          function (prev: any) {
            return prev + 2;
          },
        );

        const res = await flow.trigger('http', { queryString: { n: 0 } }, {});

        expect(res.statusCode).toEqual(201);
      });
    });
  });
});
