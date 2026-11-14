-- ============================================================
-- ACG 卡组导入器模块（嵌入现有 Global）
-- 重要：本模块不定义 onLoad，也不单独调用 UI.setXml。
-- 将本模块粘贴到现有 Global 脚本最末尾，并按说明把 ACG_UI_XML
-- 拼接进现有 applyAllUI()，即可与原有界面共存。
-- ============================================================

ACG_BASE_URL = "https://ren-scarlet.github.io/ACG-/"
ACG_CARDS_JSON_URL = ACG_BASE_URL .. "data/cards.json"
ACG_CARD_BACK_URL = "" -- 暂时留空：使用卡牌正面作为背面，之后可替换为统一卡背 URL。

local ACG_shareUrl = ""

-- 仅负责界面 XML；由现有 applyAllUI() 统一发送。
ACG_UI_XML = [[
<Button id="ACGOpenButton" text="ACG 卡组导入" rectAlignment="UpperLeft"
        offsetXY="50 -50" width="170" height="42"
        colors="#303744|#46536A|#252B35|#303744"
        textColor="#FFFFFF" fontSize="17" onClick="ACG_togglePanel"/>
<Panel id="ACGPanel" active="false" width="520" height="230"
       rectAlignment="MiddleLeft" pivot="0 0.5" offsetXY="50 0"
       color="#171923F5">
    <VerticalLayout padding="14 14 14 14" spacing="9"
                    childForceExpandHeight="false">
        <Panel preferredHeight="36" color="#242936">
            <Text text="ACG 卡组导入器" fontSize="21" color="#FFFFFF"
                  alignment="MiddleLeft" offsetXY="10 0"/>
            <Button text="✕" rectAlignment="MiddleRight" offsetXY="-4 0"
                    width="34" height="30" fontSize="16"
                    colors="#3A3A3A|#8A2E2E|#6E1F1F|#3A3A3A"
                    onClick="ACG_togglePanel"/>
        </Panel>
        <InputField id="ACGShareUrl" onValueChanged="ACG_setShareUrl"
                    placeholder="粘贴网页生成的完整卡组分享链接"
                    fontSize="16" characterValidation="None"
                    textColor="#FFFFFF" color="#101217"
                    preferredHeight="42"/>
        <Button text="读取链接并生成卡牌" fontSize="18"
                preferredHeight="42"
                colors="#3A526E|#4D7096|#2B4058|#3A526E"
                textColor="#FFFFFF" onClick="ACG_importDeck"/>
        <Text id="ACGStatus" text="等待输入分享链接"
              fontSize="14" color="#DDDDDD" alignment="MiddleLeft"/>
    </VerticalLayout>
</Panel>
]]

function ACG_togglePanel(player, value, id)
    local active = UI.getAttribute("ACGPanel", "active")
    UI.setAttribute("ACGPanel", "active", active == "true" and "false" or "true")
end

function ACG_setShareUrl(player, value, id)
    ACG_shareUrl = value or ""
end

local function ACG_status(message, color)
    UI.setAttribute("ACGStatus", "text", message)
    if color then UI.setAttribute("ACGStatus", "color", color) end
    print("[ACG] " .. message)
end

local function ACG_base64UrlDecode(input)
    local alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    local lookup = {}
    for i = 1, #alphabet do
        lookup[alphabet:sub(i, i)] = i - 1
    end

    local output, buffer, bits = {}, 0, 0
    for i = 1, #input do
        local ch = input:sub(i, i)
        local value = lookup[ch]
        if value == nil then
            error("分享链接包含无法识别的编码字符。")
        end
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
    if not encoded then
        error("没有找到 #deck= 分享数据，请复制网页生成的完整链接。")
    end

    local decoded = ACG_base64UrlDecode(encoded)
    local payload = JSON.decode(decoded)
    if type(payload) ~= "table" or payload.version ~= 1
        or type(payload.cards) ~= "table" then
        error("不支持这份卡组数据，请从当前网页重新生成分享链接。")
    end
    if #payload.cards == 0 then
        error("这份卡组没有卡牌。")
    end
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

local function ACG_spawnCard(card, index, onDone)
    local column = (index - 1) % 5
    local row = math.floor((index - 1) / 5)
    local position = {
        x = (column - 2) * 2.25,
        y = 3 + row * 0.15,
        z = (row - 1) * 3.25
    }

    local faceUrl = ACG_absoluteImageUrl(card.image)
    local backUrl = ACG_CARD_BACK_URL ~= "" and ACG_CARD_BACK_URL or faceUrl

    -- TTS 要求在 spawnObject 返回后立即设置自定义卡面，
    -- 不要等 callback_function（生成完成后的回调）才设置。
    local ok, objOrError = pcall(function()
        local obj = spawnObject({
            type = "CardCustom",
            position = position,
            callback_function = function(spawnedObj)
                local callbackOk, callbackError = pcall(function()
                    spawnedObj.setName(card.name or card.id)
                    spawnedObj.setDescription((card.effect or "") .. "\n\n卡牌ID：" .. card.id)
                end)
                if onDone then onDone(callbackOk, callbackError) end
            end
        })

        if not obj then
            error("TTS 未能创建卡牌对象。")
        end

        obj.setCustomObject({
            face = faceUrl,
            back = backUrl,
            sideways = false
        })

        return obj
    end)

    if not ok and onDone then
        onDone(false, objOrError)
    end
end

function ACG_importDeck(player, value, id)
    local ok, payload = pcall(ACG_extractPayload, ACG_shareUrl)
    if not ok then
        ACG_status(tostring(payload), "#FF7777")
        return
    end

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
                or type(entry.quantity) ~= "number"
                or entry.quantity < 1 or entry.quantity % 1 ~= 0 then
                ACG_status("分享数据中存在无效的卡牌数量。", "#FF7777")
                return
            end

            local card = byId[entry.id]
            if not card then
                ACG_status("找不到卡牌 ID：" .. entry.id .. "。", "#FF7777")
                return
            end

            for n = 1, entry.quantity do
                spawnList[#spawnList + 1] = card
            end
        end

        local total = #spawnList
        local completed = 0
        local failed = false
        ACG_status("资料读取完成，正在生成 " .. tostring(total) .. " 张卡牌……", "#FFE08A")

        for index, card in ipairs(spawnList) do
            ACG_spawnCard(card, index, function(spawnOk, spawnError)
                completed = completed + 1
                if not spawnOk and not failed then
                    failed = true
                    ACG_status("有卡牌生成失败：" .. tostring(spawnError), "#FF7777")
                end
                if completed == total and not failed then
                    ACG_status("导入完成：已生成 " .. tostring(total) .. " 张卡牌。", "#8FE3A1")
                    if ACG_CARD_BACK_URL == "" then
                        broadcastToAll(
                            "[ACG] 当前暂用卡牌正面作为背面，之后可以替换为统一卡背。",
                            {1, 0.8, 0.4}
                        )
                    end
                end
            end)
        end
    end)
end
