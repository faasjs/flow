import Flow from '../../index';

describe('trigger.custom', function () {
  test('should work', async function () {
    const flow = new Flow(
      {
        resource: {
          handler: () => 1
        },
        triggers: {
          custom: {
            resource: {},
            handler: require('./custom/index').default
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
