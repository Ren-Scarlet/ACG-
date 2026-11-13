-- ACG Card Builder - Tabletop Simulator importer
-- Paste this file into the Global Script of your TTS save.
-- Share format: #deck=<base64url(JSON)>; payload version 1: {version=1,cards=[{id,quantity},...]}.

ACG_BASE_URL = "https://ren-scarlet.github.io/ACG-/"
ACG_CARDS_JSON_URL = ACG_BASE_URL .. "data/cards.json"
ACG_CARD_BACK_URL = "" -- Optional: set this to a public JPG/PNG card-back URL. Blank uses each card's face as a temporary back.

local ACG_shareUrl = ""

function onLoad()
    self.UI.setXml(ACG_UI_XML)
end

ACG_UI_XML = [[
<Panel width="760" height="180" position="0 0 -250" color="#171923" allowDragging="true">
    <VerticalLayout padding="12 12 12 12" spacing="8">
        <Text text="ACG 卡组导入器" fontSize="24" color="#FFFFFF" alignment="MiddleLeft"/>
        <InputField id="acgShareUrl" onValueChanged="ACG_setShareUrl" placeholder="粘贴网页生成的卡组分享链接" fontSize="18" characterValidation="None"/>
        <Button onClick="ACG_importDeck" fontSize="20" preferredHeight="42">读取链接并生成卡牌</Button>
        <Text id="acgStatus" text="等待输入分享链接" fontSize="15" color="#DDDDDD" alignment="MiddleLeft"/>
    </VerticalLayout>
</Panel>
]]

function ACG_setShareUrl(player, value, id)
    ACG_shareUrl = value or ""
end

local function ACG_status(message, color)
    UI.setAttribute("acgStatus", "text", message)
    if color then UI.setAttribute("acgStatus", "color", color) end
    print("[ACG] " .. message)
end

local function ACG_base64UrlDecode(input)
    local alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    local lookup = {}
    for i = 1, #alphabet do lookup[alphabet:sub(i, i)] = i - 1 end
    local output, buffer, bits = {}, 0, 0
    for i = 1, #input do
        local ch = input:sub(i, i)
        local value = lookup[ch]
        if value == nil then error("分享链接包含无法识别的编码字符。") end
        buffer = buffer * 64 + value
        bits = bits + 6
        if bits >= 8 then
            bits = bits - 8
            local byte = math.floor(buffer / (2 ^ bits)) % 256
            output[#output + 1] = string.char(byte)
            buffer = buffer % (2 ^ bits)
        end
    end
    return table.concat(output)
end

local function ACG_extractPayload(url)
    local encoded = string.match(url or "", "#deck=([A-Za-z0-9_%-]+)")
    if not encoded then error("没有找到 #deck= 分享数据，请复制网页生成的完整链接。") end
    local decoded = ACG_base64UrlDecode(encoded)
    local payload = JSON.decode(decoded)
    if type(payload) ~= "table" or payload.version ~= 1 or type(payload.cards) ~= "table" then
        error("不支持这份卡组数据。请从当前网页重新生成分享链接。")
    end
    if #payload.cards == 0 then error("这份卡组没有卡牌。") end
    return payload
end

local function ACG_encodePath(path)
    path = string.gsub(path or "", "^%./", "")
    return (string.gsub(path, "([^%w%-_%.~/%:])", function(ch)
        return string.format("%%%02X", string.byte(ch))
    end))
end

local function ACG_absoluteImageUrl(path)
    if string.match(path or "", "^https?://") then return path end
    return ACG_BASE_URL .. ACG_encodePath(path)
end

local function ACG_spawnCard(card, index)
    local column = (index - 1) % 5
    local row = math.floor((index - 1) / 5)
    local position = {x = (column - 2) * 2.25, y = 3 + row * 0.15, z = (row - 1) * 3.25}
    local faceUrl = ACG_absoluteImageUrl(card.image)
    local backUrl = ACG_CARD_BACK_URL ~= "" and ACG_CARD_BACK_URL or faceUrl
    local obj = spawnObject({type = "CardCustom", position = position})
    obj.setCustomObject({face = faceUrl, back = backUrl, sideways = false})
    obj.setName(card.name or card.id)
    obj.setDescription((card.effect or "") .. "\n\n卡牌ID：" .. card.id)
end

function ACG_importDeck(player, value, id)
    local ok, payload = pcall(ACG_extractPayload, ACG_shareUrl)
    if not ok then ACG_status(tostring(payload), "#FF7777"); return end
    ACG_status("正在读取卡牌资料……", "#FFE08A")
    WebRequest.get(ACG_CARDS_JSON_URL, function(request)
        if request.is_error then
            ACG_status("读取卡牌资料失败：" .. tostring(request.error), "#FF7777")
            return
        end
        if request.response_code ~= 200 then
            ACG_status("读取卡牌资料失败，HTTP " .. tostring(request.response_code), "#FF7777")
            return
        end
        local decodeOk, allCards = pcall(JSON.decode, request.text)
        if not decodeOk or type(allCards) ~= "table" then
            ACG_status("卡牌资料 JSON 无法解析。", "#FF7777")
            return
        end
        local byId = {}
        for _, card in ipairs(allCards) do
            if card.id then byId[card.id] = card end
        end
        local spawnList = {}
        for _, entry in ipairs(payload.cards) do
            if type(entry) ~= "table" or type(entry.id) ~= "string"
                or type(entry.quantity) ~= "number" or entry.quantity < 1
                or entry.quantity % 1 ~= 0 then
                ACG_status("分享数据中存在无效的卡牌数量。", "#FF7777")
                return
            end
            local card = byId[entry.id]
            if not card then
                ACG_status("找不到卡牌 ID：" .. entry.id .. "。可能是卡牌已从资料库移除。", "#FF7777")
                return
            end
            for n = 1, entry.quantity do spawnList[#spawnList + 1] = card end
        end
        for index, card in ipairs(spawnList) do
            local spawnOk, spawnError = pcall(ACG_spawnCard, card, index)
            if not spawnOk then
                ACG_status("生成卡牌时发生错误：" .. tostring(spawnError), "#FF7777")
                return
            end
        end
        ACG_status("导入完成：已生成 " .. tostring(#spawnList) .. " 张卡牌。", "#8FE3A1")
        if ACG_CARD_BACK_URL == "" then
            broadcastToAll("[ACG] 提示：当前暂用卡牌正面作为背面，之后可以替换为统一卡背。", {1, 0.8, 0.4})
        end
    end)
end
