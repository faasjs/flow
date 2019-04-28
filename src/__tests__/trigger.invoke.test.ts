import Flow from '../index';

describe('trigger.http', function () {
  describe('basic', function () {
    test('sync mode', async function () {
      const flow = new Flow(
        {},
        function (prev: any) {
          return prev + 1;
        },
        function (prev: any) {
          return prev + 2;
        },
      );

      const res = await flow.createTrigger('invoke', -1)(0, {});

      expect(res).toEqual(3);
    });

    test('async mode', async function () {
      const flow = new Flow(
        {
          mode: 'async',
        },
        function (prev: any) {
          return prev + 1;
        },
        function (prev: any) {
          return prev + 2;
        },
      );

      const res = await flow.createTrigger('invoke', 0)(0, {});

      expect(res).toEqual(1);
    });
  });
});
