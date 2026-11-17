-- ACG Fishing V2 - isolated world, habitats, weather windows and expanded fish catalogue.
-- Apply AFTER fishing-system-v1.sql, fishing-server-authoritative-v1.sql,
-- and fishing-achievements-shop-v1.sql.
-- This migration is additive: it does not replace login, player, inventory,
-- card, draw, battle, or existing fishing RPC functions.

begin;

do $preflight$
begin
  if to_regclass('public.fishing_fish_catalog') is null
     or to_regclass('public.fishing_bait_catalog') is null
     or to_regclass('public.player_fishbook') is null
     or to_regprocedure('public.is_admin()') is null then
    raise exception 'Fishing V2 prerequisite missing. Run the existing fishing V1 migrations first; no V2 changes were applied.';
  end if;
end
$preflight$;

alter table public.fishing_fish_catalog
  add column if not exists size_small_min_cm numeric(7,2),
  add column if not exists size_small_max_cm numeric(7,2),
  add column if not exists size_medium_min_cm numeric(7,2),
  add column if not exists size_medium_max_cm numeric(7,2),
  add column if not exists size_large_min_cm numeric(7,2),
  add column if not exists size_large_max_v2_cm numeric(7,2),
  add column if not exists rarity text not null default 'common',
  add column if not exists is_hidden boolean not null default false,
  add column if not exists description text not null default '',
  add column if not exists v2_available boolean not null default false;

create table if not exists public.fishing_locations_v2 (
  location_id text primary key,
  location_name text not null,
  description text not null default '',
  icon text not null default '🌊',
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.fishing_weather_slots_v2 (
  slot_start timestamptz primary key,
  weather_id text not null check (weather_id in ('sunny','cloudy','rain','fog','storm','windy')),
  created_at timestamptz not null default now()
);

create table if not exists public.fishing_fish_rules_v2 (
  fish_id text primary key references public.fishing_fish_catalog(fish_id) on delete cascade,
  location_id text not null references public.fishing_locations_v2(location_id),
  weather_ids text[] not null default '{}',
  previous_weather_ids text[] not null default '{}',
  start_hour_local smallint,
  end_hour_local smallint,
  required_fish_id text references public.fishing_fish_catalog(fish_id),
  catch_weight numeric(10,4) not null default 1 check (catch_weight > 0),
  is_hidden boolean not null default false,
  clue text not null default '',
  check (start_hour_local is null or start_hour_local between 0 and 23),
  check (end_hour_local is null or end_hour_local between 0 and 23)
);

create index if not exists fishing_fish_rules_location_idx
  on public.fishing_fish_rules_v2(location_id);
create index if not exists fishing_fish_rules_weather_gin_idx
  on public.fishing_fish_rules_v2 using gin(weather_ids);

alter table public.fishing_locations_v2 enable row level security;
alter table public.fishing_weather_slots_v2 enable row level security;
alter table public.fishing_fish_rules_v2 enable row level security;
revoke all on public.fishing_locations_v2,public.fishing_weather_slots_v2,
  public.fishing_fish_rules_v2 from public,anon,authenticated;

insert into public.fishing_locations_v2(location_id,location_name,description,icon,sort_order)
values
 ('qinglan_lake','晴岚湖','湖面平缓，适合初学者认识常见鱼种。','🌅',1),
 ('reed_marsh','芦苇湿地','水草茂密，雨雾天气常有稀有鱼出没。','🌾',2),
 ('deepwater_bay','深水湾','水域幽深，大型鱼与传说鱼的栖息地。','🌊',3)
on conflict(location_id) do update set
 location_name=excluded.location_name,description=excluded.description,
 icon=excluded.icon,sort_order=excluded.sort_order,is_active=true;

-- Ensure all ten original species exist even when an earlier installation
-- contains only a partial catalogue. This is an idempotent catalogue upsert;
-- catch history, player balances and fishbook records are not rewritten.
insert into public.fishing_fish_catalog
 (fish_id,bait_id,fish_name,small_max_cm,medium_cm,large_min_cm,large_max_cm,
  small_points,medium_points,large_points,appearance_weight,sort_order,
  size_small_min_cm,size_small_max_cm,size_medium_min_cm,size_medium_max_cm,
  size_large_min_cm,size_large_max_v2_cm,rarity,is_hidden,description,v2_available)
values
 ('red_fish','small_mixed_bait','红鱼',9,10,11,18,10,15,25,1.3,1,5,9,10,12,13,18,'common',false,晴岚湖最常见的鱼。',true),
 ('rough_scale_crucian','small_mixed_bait','糙鳞鲫鱼',14,15,16,26,15,25,40,1.1,2,10,14,15,19,20,26,'common',false,鳞片粗糙，适应力很强的底栖鱼。',true),
 ('elegant_mirror_fish','small_mixed_bait','风雅镜鱼',19,20,21,34,20,35,55,0.8,3,12,19,20,25,26,34,'uncommon',false,鳞片会映出湖面微光的优雅鱼种。',true),
 ('rainbow_trout','medium_mixed_bait','七彩鳟鱼',29,30,31,46,35,55,85,1.0,4,20,29,30,36,37,46,'uncommon',false,色彩斑斓，喜欢水流清澈的水域。',true),
 ('shiro_carp','medium_mixed_bait','史郎鲤鱼',39,40,41,62,50,80,120,1.0,5,25,39,40,48,49,62,'uncommon',false,身形修长，常在水草边缘活动。',true),
 ('rare_treasure_trout','medium_mixed_bait','稀宝鳟鱼',49,50,51,76,70,110,170,0.65,6,28,49,50,59,60,76,'rare',false,偶尔会在清晨的深水区现身。',true),
 ('delicious_mirror_fish','large_mixed_bait','美味镜鱼',79,80,81,118,100,160,240,1.0,7,40,79,80,94,95,118,'rare',false,肉质丰腴的大型鱼，喜欢深水湾。',true),
 ('peerless_crucian','large_mixed_bait','无双鲫鱼',89,90,91,135,140,220,330,0.7,8,45,89,90,104,105,135,'epic',false,力气惊人，只有经验丰富的钓手才能驾驭。',true),
 ('ichigaya_fish_king','unknown_mixed_bait','市谷的鱼王',119,120,121,170,350,600,900,0.18,9,80,119,120,139,140,170,'legendary',false,鱼王会在浓雾中现身。',true),
 ('ichigaya_fish_king_king','unknown_mixed_bait','市谷的鱼王之王',169,171,173,230,600,1000,1500,0.05,10,120,169,170,189,190,230,'mythic',false,传说中只有经历特殊天气变化才会现身。',true)
on conflict (fish_id) do update set
 bait_id=excluded.bait_id,fish_name=excluded.fish_name,
 small_max_cm=excluded.small_max_cm,medium_cm=excluded.medium_cm,
 large_min_cm=excluded.large_min_cm,large_max_cm=excluded.large_max_cm,
 small_points=excluded.small_points,medium_points=excluded.medium_points,
 large_points=excluded.large_points,appearance_weight=excluded.appearance_weight,
 sort_order=excluded.sort_order,
 size_small_min_cm=excluded.size_small_min_cm,size_small_max_cm=excluded.size_small_max_cm,
 size_medium_min_cm=excluded.size_medium_min_cm,size_medium_max_cm=excluded.size_medium_max_cm,
 size_large_min_cm=excluded.size_large_min_cm,size_large_max_v2_cm=excluded.size_large_max_v2_cm,
 rarity=excluded.rarity,is_hidden=false,description=excluded.description,is_active=true,v2_available=true;

-- The original 10 species remain in place. Their catalogue values are adjusted
-- to the approved lower reward economy; historical ledger entries are untouched.
update public.fishing_fish_catalog set
 small_points=10,medium_points=15,large_points=25,
 size_small_min_cm=5,size_small_max_cm=9,
 size_medium_min_cm=10,size_medium_max_cm=12,
 size_large_min_cm=13,size_large_max_v2_cm=18,
 rarity='common',description='湖中常见的小型鱼类。'
where fish_id='red_fish';

update public.fishing_fish_catalog set
 small_points=15,medium_points=25,large_points=40,
 size_small_min_cm=10,size_small_max_cm=14,
 size_medium_min_cm=15,size_medium_max_cm=19,
 size_large_min_cm=20,size_large_max_v2_cm=26,
 rarity='common',description='鳞片粗糙，适应力很强的底栖鱼。'
where fish_id='rough_scale_crucian';

update public.fishing_fish_catalog set
 small_points=20,medium_points=35,large_points=55,
 size_small_min_cm=12,size_small_max_cm=19,
 size_medium_min_cm=20,size_medium_max_cm=25,
 size_large_min_cm=26,size_large_max_v2_cm=34,
 rarity='uncommon',description='鳞片会映出湖面微光的优雅鱼种。'
where fish_id='elegant_mirror_fish';

update public.fishing_fish_catalog set
 small_points=35,medium_points=55,large_points=85,
 size_small_min_cm=20,size_small_max_cm=29,
 size_medium_min_cm=30,size_medium_max_cm=36,
 size_large_min_cm=37,size_large_max_v2_cm=46,
 rarity='common',description='色彩斑斓，喜欢水流清澈的水域。'
where fish_id='rainbow_trout';

update public.fishing_fish_catalog set
 small_points=50,medium_points=80,large_points=120,
 size_small_min_cm=25,size_small_max_cm=39,
 size_medium_min_cm=40,size_medium_max_cm=48,
 size_large_min_cm=49,size_large_max_v2_cm=62,
 rarity='uncommon',description='身形修长，常在水草边缘活动。'
where fish_id='shiro_carp';

update public.fishing_fish_catalog set
 small_points=70,medium_points=110,large_points=170,
 size_small_min_cm=28,size_small_max_cm=49,
 size_medium_min_cm=50,size_medium_max_cm=59,
 size_large_min_cm=60,size_large_max_v2_cm=76,
 rarity='rare',description='偶尔会在清晨的深水区现身。'
where fish_id='rare_treasure_trout';

update public.fishing_fish_catalog set
 small_points=100,medium_points=160,large_points=240,
 size_small_min_cm=40,size_small_max_cm=79,
 size_medium_min_cm=80,size_medium_max_cm=94,
 size_large_min_cm=95,size_large_max_v2_cm=118,
 rarity='rare',description='肉质丰腴的大型鱼，喜欢深水湾。'
where fish_id='delicious_mirror_fish';

update public.fishing_fish_catalog set
 small_points=140,medium_points=220,large_points=330,
 size_small_min_cm=45,size_small_max_cm=89,
 size_medium_min_cm=90,size_medium_max_cm=104,
 size_large_min_cm=105,size_large_max_v2_cm=135,
 rarity='epic',description='力气惊人，只有经验丰富的钓手才能驾驭。'
where fish_id='peerless_crucian';

update public.fishing_fish_catalog set
 small_points=350,medium_points=600,large_points=900,
 size_small_min_cm=80,size_small_max_cm=119,
 size_medium_min_cm=120,size_medium_max_cm=139,
 size_large_min_cm=140,size_large_max_v2_cm=170,
 rarity='legendary',description='传说中栖息于晴岚湖深处的鱼王。'
where fish_id='ichigaya_fish_king';

update public.fishing_fish_catalog set
 small_points=600,medium_points=1000,large_points=1500,
 size_small_min_cm=120,size_small_max_cm=169,
 size_medium_min_cm=170,size_medium_max_cm=189,
 size_large_min_cm=190,size_large_max_v2_cm=230,
 rarity='mythic',description='极少有人见过它的真容。'
where fish_id='ichigaya_fish_king_king';

-- 22 additional ordinary species: 7 small-bait, 8 medium-bait, 7 large-bait.
insert into public.fishing_fish_catalog
 (fish_id,bait_id,fish_name,small_max_cm,medium_cm,large_min_cm,large_max_cm,
  small_points,medium_points,large_points,appearance_weight,sort_order,
  size_small_min_cm,size_small_max_cm,size_medium_min_cm,size_medium_max_cm,
  size_large_min_cm,size_large_max_v2_cm,rarity,is_hidden,description,is_active,v2_available)
values
 ('silver_dace','small_mixed_bait','银线鱼',8,9,10,16,12,18,28,1.2,11,4,8,9,11,12,16,'common',false,'银白色细鳞在浅水中闪闪发亮。',false,true),
 ('bluegill','small_mixed_bait','蓝鳃太阳鱼',11,12,13,20,14,22,32,1.0,12,6,11,12,14,15,20,'common',false,'常在水草与阳光交界处觅食。',false,true),
 ('striped_minnow','small_mixed_bait','斑纹溪鳑',13,14,15,23,16,24,36,0.9,13,7,13,14,16,17,23,'common',false,'身体带有细密横纹的小鱼。',false,true),
 ('amber_loach','small_mixed_bait','琥珀泥鳅',15,16,17,27,18,28,42,0.85,14,8,15,16,18,19,27,'uncommon',false,'喜欢藏身在湖底柔软的泥沙里。',false,true),
 ('glass_perch','small_mixed_bait','玻璃鲈',17,18,19,30,20,32,48,0.75,15,9,17,18,20,21,30,'uncommon',false,'半透明的鱼身能映出周围水色。',false,true),
 ('lotus_koi','small_mixed_bait','莲纹锦鲤',19,20,21,34,24,36,54,0.65,16,10,19,20,22,23,34,'rare',false,'常在莲叶下缓慢游动。',false,true),
 ('dusk_goby','small_mixed_bait','暮色虾虎',21,22,23,36,26,40,60,0.55,17,11,21,22,24,25,36,'rare',false,'黄昏时分更容易靠近岸边。',false,true),

 ('mistfin_trout','medium_mixed_bait','雾鳍鳟',25,26,27,42,38,60,92,1.15,18,14,25,26,29,30,42,'common',false,'雾气弥漫时常在水面附近活动。',false,true),
 ('reed_whisker','medium_mixed_bait','芦苇须鲶',32,33,34,54,45,72,108,1.0,19,18,32,33,37,38,54,'common',false,'以细长触须探寻芦苇根部的食物。',false,true),
 ('jade_scale_carp','medium_mixed_bait','青玉鳞鲤',38,39,40,64,55,88,132,0.9,20,22,38,39,44,45,64,'uncommon',false,'鳞片泛着淡淡的青绿色。',false,true),
 ('rainbell_fish','medium_mixed_bait','雨铃鱼',42,43,44,70,62,98,148,0.8,21,25,42,43,48,49,70,'uncommon',false,'雨点落在水面时会发出清脆声响。',false,true),
 ('moonlit_bass','medium_mixed_bait','月影鲈',48,49,50,80,72,115,172,0.75,22,28,48,49,55,56,80,'rare',false,'月光下会显现出银蓝色的背鳍。',false,true),
 ('stormscale_pike','medium_mixed_bait','雷纹狗鱼',55,56,57,92,82,132,198,0.65,23,32,55,56,63,64,92,'rare',false,'暴雨前后会变得格外活跃。',false,true),
 ('golden_fin_bream','medium_mixed_bait','金鳍鲷',62,63,64,105,95,150,225,0.55,24,36,62,63,72,73,105,'epic',false,'金色背鳍是它最醒目的特征。',false,true),
 ('deepwater_catfish','medium_mixed_bait','深湾巨鲶',70,71,72,120,110,175,260,0.45,25,40,70,71,82,83,120,'epic',false,'深水湾底部的强壮掠食者。',false,true),

 ('cobalt_tuna','large_mixed_bait','钴蓝金枪鱼',72,73,74,118,105,165,250,1.1,26,42,72,73,85,86,118,'uncommon',false,'速度极快，常在开阔水域追逐鱼群。',false,true),
 ('sunset_gar','large_mixed_bait','赤霞雀鳝',82,83,84,135,120,190,285,1.0,27,48,82,83,97,98,135,'uncommon',false,'夕阳映照下，长吻呈现赤红色。',false,true),
 ('ironback_sturgeon','large_mixed_bait','铁背鲟',95,96,97,158,140,225,340,0.9,28,55,95,96,113,114,158,'rare',false,'厚重骨板保护着它宽阔的身躯。',false,true),
 ('whitewater_salmon','large_mixed_bait','白浪鲑',105,106,107,175,155,250,375,0.8,29,62,105,106,125,126,175,'rare',false,'喜欢水流湍急、含氧量高的水域。',false,true),
 ('ancient_shellfish','large_mixed_bait','古甲鲶',118,119,120,198,175,280,420,0.7,30,70,118,119,141,142,198,'epic',false,'背部覆有古老甲片的巨型鱼类。',false,true),
 ('aurora_ray','large_mixed_bait','极光鳐',132,133,134,220,195,315,470,0.6,31,78,132,133,158,159,220,'epic',false,'夜色中身体边缘会泛起极光般的微光。',false,true),
 ('abyssal_manta','large_mixed_bait','渊海蝠鲼',150,151,152,250,225,360,540,0.45,32,90,150,151,180,181,250,'legendary',false,'深水湾最神秘的常驻大型鱼。',false,true),

 -- Four hidden species. Their conditions are enforced by the v2 fishing resolver.
 ('rainbow_phantom','unknown_mixed_bait','虹影鱼',95,96,97,155,180,280,420,0.25,33,58,95,96,116,117,155,'mythic',true,'只有在雨后放晴时，湖面才会留下它的影子。',false,true),
 ('fog_veil_koi','unknown_mixed_bait','雾隐锦鲤',110,111,112,180,220,340,510,0.2,34,65,110,111,134,135,180,'mythic',true,'浓雾笼罩芦苇湿地时，偶尔能看见一抹金色。',false,true),
 ('thunder_crown_eel','unknown_mixed_bait','雷冠鳗',130,131,132,215,260,400,600,0.16,35,75,130,131,158,159,215,'legendary',true,'雷雨交加时，深水中会出现短暂的电光。',false,true),
 ('old_lake_dragon','unknown_mixed_bait','古湖龙鱼',180,181,182,300,350,550,820,0.08,36,105,180,181,220,221,300,'mythic',true,'传说只有集齐古老鱼讯，才能唤醒沉睡的湖之主。',false,true)
on conflict (fish_id) do update set
 bait_id=excluded.bait_id,fish_name=excluded.fish_name,
 small_max_cm=excluded.small_max_cm,medium_cm=excluded.medium_cm,
 large_min_cm=excluded.large_min_cm,large_max_cm=excluded.large_max_cm,
 small_points=excluded.small_points,medium_points=excluded.medium_points,
 large_points=excluded.large_points,appearance_weight=excluded.appearance_weight,
 sort_order=excluded.sort_order,
 size_small_min_cm=excluded.size_small_min_cm,size_small_max_cm=excluded.size_small_max_cm,
 size_medium_min_cm=excluded.size_medium_min_cm,size_medium_max_cm=excluded.size_medium_max_cm,
 size_large_min_cm=excluded.size_large_min_cm,size_large_max_v2_cm=excluded.size_large_max_v2_cm,
 rarity=excluded.rarity,is_hidden=excluded.is_hidden,description=excluded.description,
 is_active=case when fishing_fish_catalog.v2_available
   then fishing_fish_catalog.is_active else false end,
 v2_available=true;

-- Hide undiscovered fish immediately, even between the two ordered V2 migrations.
drop policy if exists fishing_fish_catalog_read on public.fishing_fish_catalog;
create policy fishing_fish_catalog_read on public.fishing_fish_catalog
 for select to authenticated
 using (
   ((is_active or v2_available) and not is_hidden)
   or public.is_admin()
   or exists (
     select 1 from public.player_fishbook b
     where b.user_id=auth.uid() and b.fish_id=fishing_fish_catalog.fish_id
   )
 );

-- Habitat and encounter conditions. Empty weather arrays mean no weather restriction.
insert into public.fishing_fish_rules_v2
 (fish_id,location_id,weather_ids,previous_weather_ids,start_hour_local,end_hour_local,
  required_fish_id,catch_weight,is_hidden,clue)
values
 ('red_fish','qinglan_lake','{}','{}',null,null,null,1.3,false,'晴岚湖最常见的鱼。'),
 ('rough_scale_crucian','qinglan_lake','{}','{}',null,null,null,1.1,false,'湖底泥沙附近常见。'),
 ('elegant_mirror_fish','qinglan_lake','{sunny,cloudy}','{}',6,18,null,0.8,false,'日间较容易发现。'),
 ('silver_dace','qinglan_lake','{}','{}',null,null,null,1.2,false,'浅水鱼群。'),
 ('bluegill','qinglan_lake','{sunny,cloudy}','{}',6,17,null,1.0,false,'喜欢阳光照射的水面。'),
 ('striped_minnow','reed_marsh','{}','{}',null,null,null,1.0,false,'芦苇边缘的细小鱼群。'),
 ('amber_loach','reed_marsh','{rain,cloudy}','{}',null,null,null,0.9,false,'雨天泥底活动增加。'),
 ('glass_perch','reed_marsh','{fog,cloudy}','{}',null,null,null,0.8,false,'水色朦胧时更容易发现。'),
 ('lotus_koi','reed_marsh','{sunny}','{}',5,10,null,0.7,false,'清晨莲叶间有动静。'),
 ('dusk_goby','reed_marsh','{}','{}',17,23,null,0.7,false,'黄昏后靠岸活动。'),
 ('rainbow_trout','qinglan_lake','{rain,cloudy}','{}',null,null,null,1.0,false,'阴雨天更活跃。'),
 ('shiro_carp','reed_marsh','{}','{}',null,null,null,1.0,false,'芦苇根部有它的踪迹。'),
 ('rare_treasure_trout','deepwater_bay','{fog,rain}','{}',4,11,null,0.65,false,'清晨深水雾气中出现。'),
 ('mistfin_trout','reed_marsh','{fog}','{}',4,12,null,1.2,false,'雾鳍在雾气中更容易被吸引。'),
 ('reed_whisker','reed_marsh','{rain}','{}',null,null,null,1.0,false,'雨水带来更多食物。'),
 ('jade_scale_carp','qinglan_lake','{sunny,cloudy}','{}',null,null,null,0.9,false,'青玉色鳞片在白天更明显。'),
 ('rainbell_fish','reed_marsh','{rain}','{}',null,null,null,1.1,false,'雨声会引来雨铃鱼。'),
 ('moonlit_bass','deepwater_bay','{}','{}',19,4,null,0.8,false,'夜间深水活动。'),
 ('stormscale_pike','deepwater_bay','{storm}','{}',null,null,null,0.9,false,'雷雨时鱼群活跃。'),
 ('golden_fin_bream','qinglan_lake','{sunny}','{}',7,15,null,0.65,false,'午前阳光照亮金色背鳍。'),
 ('deepwater_catfish','deepwater_bay','{cloudy,rain}','{}',null,null,null,0.7,false,'阴雨时沉在深水底部。'),
 ('cobalt_tuna','deepwater_bay','{windy}','{}',null,null,null,1.1,false,'风浪让它们靠近湾口。'),
 ('sunset_gar','qinglan_lake','{sunny,cloudy}','{}',16,20,null,0.9,false,'夕阳时分出现在湖面。'),
 ('ironback_sturgeon','deepwater_bay','{rain,storm}','{}',null,null,null,0.75,false,'水流增强时更活跃。'),
 ('whitewater_salmon','deepwater_bay','{windy,rain}','{}',null,null,null,0.8,false,'喜欢水流翻涌的时刻。'),
 ('ancient_shellfish','deepwater_bay','{cloudy,fog}','{}',null,null,null,0.6,false,'深水底部的古老鱼种。'),
 ('aurora_ray','deepwater_bay','{}','{}',20,3,null,0.55,false,'夜色中才会显露光芒。'),
 ('abyssal_manta','deepwater_bay','{fog,storm}','{}',null,null,null,0.4,false,'深水湾天气恶劣时出没。'),
 ('delicious_mirror_fish','deepwater_bay','{cloudy,rain}','{}',null,null,null,1.0,false,'深水湾的水色转暗时，肉质丰腴的大鱼会靠近。'),
 ('peerless_crucian','deepwater_bay','{fog,storm}','{}',null,null,null,0.7,false,'雾气或风暴中，大型鲫鱼会在深水活动。'),
 ('ichigaya_fish_king','deepwater_bay','{fog}','{}',null,null,null,0.18,false,'鱼王会在浓雾中现身。'),
 ('ichigaya_fish_king_king','deepwater_bay','{storm}','{rain}',null,null,null,0.05,false,'先经历降雨，再遇雷雨，传说之物才会出现。'),
 ('rainbow_phantom','qinglan_lake','{sunny}','{rain}',5,9,null,0.18,true,'雨后初晴的清晨，水面会闪过彩色残影。'),
 ('fog_veil_koi','reed_marsh','{fog}','{}',4,8,null,0.14,true,'浓雾笼罩芦苇湿地的清晨。'),
 ('thunder_crown_eel','deepwater_bay','{storm}','{}',19,23,null,0.1,true,'雷雨夜晚，深水里会闪过电光。'),
 ('old_lake_dragon','deepwater_bay','{storm}','{rain}',0,4,'ichigaya_fish_king',0.03,true,'先遇见鱼王，再经历雨转雷雨，古湖龙鱼才会现身。')
on conflict (fish_id) do update set
 location_id=excluded.location_id,weather_ids=excluded.weather_ids,
 previous_weather_ids=excluded.previous_weather_ids,
 start_hour_local=excluded.start_hour_local,end_hour_local=excluded.end_hour_local,
 required_fish_id=excluded.required_fish_id,catch_weight=excluded.catch_weight,
 is_hidden=excluded.is_hidden,clue=excluded.clue;

-- Keep a dependable fish pool at every location for every ordinary bait.
-- Weather windows change rarity and weights, but should never make a whole
-- bait unusable at a selected location.
update public.fishing_fish_rules_v2
set weather_ids='{}',previous_weather_ids='{}',start_hour_local=null,end_hour_local=null
where fish_id in ('jade_scale_carp','reed_whisker','deepwater_catfish',
                  'sunset_gar','cobalt_tuna');
update public.fishing_fish_rules_v2
set location_id='deepwater_bay',weather_ids='{}',previous_weather_ids='{}',
    start_hour_local=null,end_hour_local=null
where fish_id='bluegill';
update public.fishing_fish_rules_v2
set location_id='reed_marsh',weather_ids='{}',previous_weather_ids='{}',
    start_hour_local=null,end_hour_local=null
where fish_id='whitewater_salmon';

-- Set species rarity and reuse each encounter clue as its field-guide description.
update public.fishing_fish_catalog f
set description=r.clue,
    rarity=case
      when f.fish_id in ('ichigaya_fish_king_king','old_lake_dragon') then 'mythic'
      when f.fish_id in ('ichigaya_fish_king','rainbow_phantom','fog_veil_koi','thunder_crown_eel') then 'legendary'
      when f.fish_id in ('delicious_mirror_fish','peerless_crucian','cobalt_tuna','ironback_sturgeon',
                         'whitewater_salmon','ancient_shellfish','aurora_ray','abyssal_manta') then 'epic'
      when f.fish_id in ('rare_treasure_trout','mistfin_trout','reed_whisker','jade_scale_carp',
                         'rainbell_fish','moonlit_bass','stormscale_pike','golden_fin_bream',
                         'deepwater_catfish','sunset_gar') then 'rare'
      when f.fish_id in ('elegant_mirror_fish','rainbow_trout','shiro_carp','amber_loach',
                         'glass_perch','lotus_koi','dusk_goby','bluegill','striped_minnow') then 'uncommon'
      else 'common'
    end
from public.fishing_fish_rules_v2 r
where r.fish_id=f.fish_id;

-- A shared four-hour world forecast. The schedule is persisted once and read by
-- every player; a player's browser never chooses or changes the weather.
create or replace function public.fishing_get_world_state_v2()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_slot timestamptz;
  v_weather_ids text[] := array['sunny','cloudy','rain','fog','storm','windy'];
  v_current text;
  v_previous text;
  v_forecast jsonb;
  v_hour integer;
begin
  if v_user is null then raise exception '请先登录'; end if;

  v_slot := date_trunc('day',v_now)
    + (floor(extract(hour from v_now)/4)::integer * interval '4 hours');

  insert into public.fishing_weather_slots_v2(slot_start,weather_id)
  select g, v_weather_ids[1+floor(random()*array_length(v_weather_ids,1))::integer]
  from generate_series(v_slot-interval '4 hours',v_slot+interval '12 hours',interval '4 hours') g
  on conflict(slot_start) do nothing;

  select weather_id into v_current
  from public.fishing_weather_slots_v2 where slot_start=v_slot;
  select weather_id into v_previous
  from public.fishing_weather_slots_v2 where slot_start=v_slot-interval '4 hours';

  select coalesce(jsonb_agg(jsonb_build_object(
    'starts_at',slot_start,'weather_id',weather_id,
    'is_current',slot_start=v_slot
  ) order by slot_start),'[]'::jsonb)
  into v_forecast
  from public.fishing_weather_slots_v2
  where slot_start between v_slot and v_slot+interval '12 hours';

  v_hour:=extract(hour from (v_now at time zone 'Asia/Shanghai'))::integer;
  return jsonb_build_object(
    'server_time',v_now,
    'slot_ends_at',v_slot+interval '4 hours',
    'weather_id',v_current,
    'previous_weather_id',v_previous,
    'hour_local',v_hour,
    'forecast',v_forecast,
    'locations',(select coalesce(jsonb_agg(jsonb_build_object(
      'location_id',location_id,'location_name',location_name,
      'description',description,'icon',icon
    ) order by sort_order),'[]'::jsonb)
    from public.fishing_locations_v2 where is_active=true),
    'species_total',(select count(*) from public.fishing_fish_catalog where v2_available=true),
    'hidden_total',(select count(*) from public.fishing_fish_catalog where v2_available=true and is_hidden)
  );
end;
$$;

revoke all on function public.fishing_get_world_state_v2() from public,anon,authenticated;
grant execute on function public.fishing_get_world_state_v2() to authenticated;

commit;
