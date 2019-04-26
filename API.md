<a name="Flow"></a>

## Flow
**Kind**: global class  
<a name="new_Flow_new"></a>

### new Flow(config, ...args)
新建流程


| Param | Type | Description |
| --- | --- | --- |
| config | <code>object</code> | 配置项 |
| config.mode | <code>string</code> | [config.mode=sync] 执行模式，默认为 sync 同步执行，支持 async 异步执行 |
| [config.triggers] | <code>object</code> | 触发器配置 |
| [config.env] | <code>object</code> | 环境变量，默认支持 defaults、testing 和 production |
| [config.resourceName] | <code>string</code> | 云资源名 |
| [config.resourceConfig] | <code>object</code> | 云资源配置，将覆盖默认的云资源配置项 |
| ...args | <code>Array.&lt;step&gt;</code> | 步骤数组 |

