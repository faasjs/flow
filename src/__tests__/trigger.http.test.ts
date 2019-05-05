import Flow from '../index';

describe('trigger.http', function () {
  describe('basic', function () {
    describe('sync mode', function () {
      test('200', async function () {
        const flow = new Flow(
          {
            triggers: {
              http: {},
            },
          },
          function (prev: any) {
            return prev.query.n + 1;
          },
          function (prev: any) {
            return prev + 2;
          },
        );

        const res = await flow.createTrigger('http')({ queryString: { n: 0 } }, {});

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual('{"data":3}');
        expect(res.headers['Content-Type']).toEqual('application/json; charset=UTF-8');
      });

      test('500', async function () {
        const flow = new Flow(
          {
            triggers: {
              http: {},
            },
          },
          function () {
            throw Error('error');
          },
        );

        const res = await flow.createTrigger('http')({}, {});

        expect(res.statusCode).toEqual(500);
        expect(res.body).toEqual('{"error":{"message":"error"}}');
      });
    });

    test('async mode', async function () {
      const flow = new Flow(
        {
          mode: 'async',
          triggers: {
            http: {},
          },
        },
        function (prev: any) {
          return prev.query.n + 1;
        },
        function (prev: any) {
          return prev + 2;
        },
      );

      const res = await flow.createTrigger('http')({ queryString: { n: 0 } }, {});

      expect(res.statusCode).toEqual(201);
    });
  });

  describe('http method', function () {
    const flow = new Flow(
      {
        triggers: {
          http: {
            method: 'GET',
          },
        },
      },
      function (prev: any) {
        return prev;
      },
    );

    const trigger = flow.createTrigger('http');

    test('correct', async function () {
      const res = await trigger({ httpMethod: 'GET' }, {});

      expect(res.statusCode).toEqual(200);
    });

    test('error', async function () {
      const res = await trigger({ httpMethod: 'POST' }, {});

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual('{"error":{"message":"Wrong method"}}');
    });
  });

  describe('http params', function () {
    const flow = new Flow(
      {
        triggers: {
          http: {
            param: {
              key: {
                required: true,
              },
            },
          },
        },
      },
      function (prev: any) {
        return prev.param;
      },
    );

    const trigger = flow.createTrigger('http');

    test('correct', async function () {
      const res = await trigger({
        body: '{"key":1}',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      }, {});

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual('{"data":{"key":1}}');
    });

    test('error', async function () {
      const res = await trigger({}, {});

      expect(res.statusCode).toEqual(500);
      expect(res.body).toEqual('{"error":{"message":"key required"}}');
    });
  });
});
