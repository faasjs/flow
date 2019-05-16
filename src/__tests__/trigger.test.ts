import Flow from '../index';

test('unkown trigger', async function () {
  expect(() => new Flow({
    triggers: {
      unknow: {},
    },
  }, () => true)).toThrowError('Unknow trigger: unknow unknow');
});
