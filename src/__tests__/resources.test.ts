import Flow from '../index';

describe('resources', function () {
  // test('unkown', async function () {
  //   try {
  //     await new Flow({
  //       resources: {
  //         unknow: {},
  //       },
  //     }, () => true).createTrigger()({}, {});
  //   } catch (error) {
  //     expect(error.message).toEqual('Unknow resource: unknow unknow');
  //   }
  // });

  // test('not a function', async function () {
  //   try {
  //     await new Flow({
  //       resources: {
  //         unknow: {
  //           handler: 1
  //         },
  //       },
  //     }, () => true).createTrigger()({}, {});
  //   } catch (error) {
  //     expect(error.message).toEqual('Resource#unknow<undefined> is not a function');
  //   }
  // });

  // test('should work', async function () {
  //   const trigger = new Flow({
  //     resources: {
  //       custom: {
  //         handler: function () {
  //           return 1;
  //         }
  //       }
  //     }
  //   }, function () {
  //     return this.custom;
  //   }).createTrigger();

  //   const res = await trigger({}, {});

  //   expect(res).toEqual(1);
  // });

  test('read flow when invoke', async function () {
    const trigger = new Flow({
      resources: {
        custom: {
          handler: function (opts: any, flow: Flow) {
            return function () {
              return flow.helpers._event.key;
            };
          }
        }
      }
    }, function () {
      return this.custom();
    }).createTrigger();

    const res = await trigger({
      key: 'key'
    }, {});

    expect(res).toEqual('key');
  });
});
