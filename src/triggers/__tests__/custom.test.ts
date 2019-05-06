import Flow from '../../index';

describe('trigger.custom', function () {
  test('should work', async function () {
    const flow = new Flow(
      {
        triggers: {
          custom: {
            resource: {
              type: 'src/triggers/__tests__/custom',
            },
          },
        },
      },
      function () {
        return;
      },
    );

    const res = await flow.createTrigger('custom')(0, {});

    expect(res).toEqual(true);
  });
});
