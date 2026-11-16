# 钓鱼系统 V1.1 部署说明

## 当前状态

主站钓场页面与基础钓鱼流程已经接入。服务器权威抛竿、提竿、收线逻辑已由用户执行并实测成功。最新前端包含钓场首页、鱼饵工坊、鱼类图鉴、成就、商店和排行榜的统一游戏化界面。

**新增的成就奖励与积分商店数据库迁移需要在 Supabase 中执行一次**，否则成就列表为空、商店商品无法读取，兑换按钮也无法正常工作。

## 数据库迁移顺序

以下文件按顺序执行。前两份此前已执行；本次只需要执行第三份：

1. `supabase/fishing-system-v1.sql`（基础表、鱼饵和鱼类目录）
2. `supabase/fishing-server-authoritative-v1.sql`（服务器权威钓鱼判定）
3. `supabase/fishing-achievements-shop-v1.sql`（本次新增：成就、积分奖励、商店商品与安全兑换）

### 本次新增迁移内容

- 初始化 11 项钓鱼成就，条件覆盖累计钓获、当前持有积分、图鉴发现数量和大型鱼获。
- 成就首次解锁时，通过数据库触发器发放钓鱼积分并写入积分流水；不会发放网站普通代币。
- 为已达到成就条件的现有玩家补登记，奖励只发放一次。
- 初始化 4 种鱼饵补给商品。
- 新增 `fishing_redeem_shop(product_id, request_id)`，在数据库事务中校验积分、库存、个人限购并扣分发放鱼饵，支持重复请求幂等处理。
- 更新玩家仪表盘，向前端提供成就奖励与商店奖励配置。

## 初版成就

| 成就 | 条件 | 奖励 |
|---|---|---:|
| 初次相遇 | 成功钓起 1 条鱼 | 25 P |
| 渐入佳境 | 累计成功钓获 10 条鱼 | 75 P |
| 湖畔熟客 | 累计成功钓获 50 条鱼 | 200 P |
| 资深钓手 | 累计成功钓获 100 条鱼 | 400 P |
| 小有收获 | 当前持有 500 点钓鱼积分 | 50 P |
| 满载而归 | 当前持有 2,000 点钓鱼积分 | 100 P |
| 湖畔富翁 | 当前持有 10,000 点钓鱼积分 | 300 P |
| 初识鱼群 | 图鉴发现 3 种鱼 | 75 P |
| 博学钓客 | 图鉴发现 6 种鱼 | 180 P |
| 青岚湖博士 | 图鉴发现全部 10 种鱼 | 400 P |
| 巨物现身 | 成功钓起 1 条大型尺寸的鱼 | 150 P |

成就一经解锁永久保留，奖励只发放一次。积分类成就按当前积分余额判断，不按历史累计流水判断。

## 初版商店

| 商品 | 内容 | 价格 |
|---|---|---:|
| 小型鱼饵补给包 | 小型混合饵 ×3 | 100 P |
| 中型鱼饵补给包 | 中型混合饵 ×2 | 450 P |
| 大型混合饵 | 大型混合饵 ×1 | 1,100 P |
| 成分不明的混合饵 | 特殊混合饵 ×1 | 4,800 P |

成分不明混合饵的合成配方仍未开放；本次只允许通过商店兑换获得。鱼类、鱼饵、尺寸档位与钓获积分均沿用原先确定的数据，没有调整。

## 执行方式

1. 打开 Supabase 项目 → SQL Editor。
2. 打开 GitHub 仓库中的 `supabase/fishing-achievements-shop-v1.sql`，复制完整内容。
3. 在 SQL Editor 新建查询并执行。
4. 将执行结果发给项目维护者；随后按下面的清单验收。

## 迁移后检查

可在 SQL Editor 单独执行以下只读检查：

```sql
select
  (select count(*) from public.fishing_achievements where is_active) as active_achievements,
  (select count(*) from public.fishing_shop_catalog where is_active) as active_shop_products,
  has_function_privilege('authenticated', 'public.fishing_redeem_shop(text,uuid)', 'EXECUTE') as redeem_allowed,
  has_function_privilege('anon', 'public.fishing_redeem_shop(text,uuid)', 'EXECUTE') as anon_redeem_allowed;
```

预期结果：`active_achievements = 11`、`active_shop_products = 4`、`redeem_allowed = true`、`anon_redeem_allowed = false`。

## 完整实机验收

- 制作鱼饵时，树果扣除数量与配方一致，鱼饵数量增加。
- 抛竿、咬钩、提竿、收线成功后，鱼获、积分、图鉴正确入账。
- 成就达到条件后自动解锁，奖励积分只发放一次。
- 商店兑换成功后，钓鱼积分扣除正确，鱼饵进入仓库。
- 积分不足、商品不存在或库存不足时兑换失败，余额不变。
- 重复提交同一个兑换请求不会重复扣分或重复发放鱼饵。
- 排行榜能读取玩家积分与钓获统计。
- 不使用正式玩家大量树果或积分做首次测试；先用测试账号小额验收。

## 服务器判定说明

- 提竿由数据库服务器时间检查，不接受客户端传入的成功/失败参数。
- 收线结果由数据库服务器根据收线开始时间和请求到达时间计算。
- 客户端不提交自报的 `p_caught` 或 `p_action_score`。
- 原来的 `fishing_resolve_cast(uuid,boolean,integer)` 执行权限已撤销。
- 简单计时玩法有服务器校验，但不能证明玩家一定由真人手动点击；不要将其描述为完全防脚本作弊。
