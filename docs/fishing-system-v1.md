# 钓鱼系统 V1.0 部署说明

## 当前状态

钓场页面已接入主站。鱼饵制作、抛竿、鱼类图鉴、独立钓鱼积分与排行榜的基础数据库结构已由 `supabase/fishing-system-v1.sql` 提供。

**本次新增的服务器判定修复尚未自动进入 Supabase。** 请在 Supabase SQL Editor 中执行本仓库的：

`supabase/fishing-server-authoritative-v1.sql`

它必须在 `supabase/fishing-system-v1.sql` 已经成功执行之后运行。不要重复执行基础迁移来代替本次补丁。

## 本次修复内容

- 提竿由数据库服务器时间检查，不接受客户端传入的成功/失败参数。
- 收线结果由数据库服务器根据收线开始时间和请求到达时间计算。
- 客户端不再提交自报的 `p_caught` 或 `p_action_score`。
- 原来的 `fishing_resolve_cast(uuid,boolean,integer)` 执行权限被撤销。
- 鱼种、尺寸档位、积分仍由服务器在抛竿时确定；成功结算、鱼图鉴、积分账本和成就更新在同一数据库事务内完成。

这能阻止玩家直接调用旧接口伪造成功标记或任意分数。它是轻量时机操作玩法的服务器校验，并不等于可以证明玩家一定由真人手动点击；不要把简单计时小游戏描述为完全防脚本作弊。

## 执行步骤

1. 打开 Supabase 项目 → SQL Editor。
2. 确认此前的 `fishing-system-v1.sql` 已经成功执行。
3. 打开 GitHub 仓库中的 `supabase/fishing-server-authoritative-v1.sql`，复制完整内容。
4. 在 SQL Editor 新建查询并执行。
5. 将执行结果发给项目维护者确认。

迁移只增加 `fishing_sessions.reel_started_at` 字段、替换/新增钓鱼 RPC 函数权限，不会清空玩家鱼饵、鱼获、图鉴或钓鱼积分。

## 部署后验收

先用一个测试账号少量制作鱼饵，然后测试：

- 正常等待咬钩、提竿、收线成功；
- 提竿过晚会逃鱼；
- 收线点不在成功区域会逃鱼；
- 同一个会话重复提交不会重复增加鱼获和积分；
- 直接调用旧的 `fishing_resolve_cast` 不应再有执行权限。

不要用正式玩家的大量树果或积分做首次测试。数据库迁移执行成功后，还需要完成上述实机流程，才能确认钓鱼闭环可用。
