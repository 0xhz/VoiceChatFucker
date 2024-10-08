/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { makeRange } from "@components/PluginSettings/components";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findStoreLazy } from "@webpack";
import { GuildChannelStore, Menu, React, RestAPI, UserStore } from "@webpack/common";
import type { Channel } from "discord-types/general";

const VoiceStateStore = findStoreLazy("VoiceStateStore");

async function runSequential<T>(promises: Promise<T>[]): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < promises.length; i++) {
        const promise = promises[i];
        const result = await promise;
        results.push(result);

        if (i % settings.store.waitAfter === 0) {
            await new Promise(resolve => setTimeout(resolve, settings.store.waitSeconds * 1000));
        }
    }

    return results;
}

function sendPatch(channel: Channel, body: Record<string, any>, bypass = false) {
    const usersVoice = VoiceStateStore.getVoiceStatesForChannel(channel.id);
    const myId = UserStore.getCurrentUser().id;

    const promises: Promise<any>[] = [];
    Object.keys(usersVoice).forEach((key, index) => {
        const userVoice = usersVoice[key];

        if (bypass || userVoice.userId !== myId) {
            promises.push(RestAPI.patch({
                url: `/guilds/${channel.guild_id}/members/${userVoice.userId}`,
                body: body
            }));
        }
    });

    runSequential(promises).catch(error => {
        console.error("VoiceChatFucker failed to run", error);
    });
}

function serverFuckerAction(currentChannel: Channel) {
    const allChannels = GuildChannelStore.getChannels(currentChannel.guild_id).VOCAL;
    const promises: Promise<any>[] = [];

    allChannels.forEach(({ channel }) => {
        const usersVoice = VoiceStateStore.getVoiceStatesForChannel(channel.id);
        Object.keys(usersVoice).forEach(key => {
            const userVoice = usersVoice[key];
            if (userVoice.userId !== UserStore.getCurrentUser().id) {
                promises.push(RestAPI.patch({
                    url: `/guilds/${channel.guild_id}/members/${userVoice.userId}`,
                    body: {
                        channel_id: currentChannel.id,
                    }
                }));
            }
        });
    });

    runSequential(promises).catch(error => {
        console.error("VoiceChatFucker Server Fucker failed to run", error);
    });
}

function userPingerAction(targetChannel: Channel) {
    const allChannels = GuildChannelStore.getChannels(targetChannel.guild_id).VOCAL;
    const promises: Promise<any>[] = [];

    allChannels.forEach(({ channel }) => {
        const usersVoice = VoiceStateStore.getVoiceStatesForChannel(channel.id);
        Object.keys(usersVoice).forEach(key => {
            const userVoice = usersVoice[key];
            if (userVoice.userId !== UserStore.getCurrentUser().id) {
                promises.push(RestAPI.patch({
                    url: `/guilds/${channel.guild_id}/members/${userVoice.userId}`,
                    body: {
                        channel_id: targetChannel.id,
                    }
                }));
            }
        });
    });

    runSequential(promises).catch(error => {
        console.error("VoiceChatFucker User Pinger failed to run", error);
    });
}

// Nova função disconnectServer
function disconnectServer(currentChannel: Channel) {
    const allChannels = GuildChannelStore.getChannels(currentChannel.guild_id).VOCAL;
    const promises: Promise<any>[] = [];

    allChannels.forEach(({ channel }) => {
        const usersVoice = VoiceStateStore.getVoiceStatesForChannel(channel.id);
        Object.keys(usersVoice).forEach(key => {
            const userVoice = usersVoice[key];
            if (userVoice.userId !== UserStore.getCurrentUser().id) {
                promises.push(RestAPI.patch({
                    url: `/guilds/${channel.guild_id}/members/${userVoice.userId}`,
                    body: {
                        channel_id: null,
                    }
                }));
            }
        });
    });

    runSequential(promises).catch(error => {
        console.error("VoiceChatFucker disconnectServer failed to run", error);
    });
}

// Nova função muteServer
function muteServer(currentChannel: Channel) {
    const allChannels = GuildChannelStore.getChannels(currentChannel.guild_id).VOCAL;
    const promises: Promise<any>[] = [];

    allChannels.forEach(({ channel }) => {
        const usersVoice = VoiceStateStore.getVoiceStatesForChannel(channel.id);
        Object.keys(usersVoice).forEach(key => {
            const userVoice = usersVoice[key];
            if (userVoice.userId !== UserStore.getCurrentUser().id) {
                promises.push(RestAPI.patch({
                    url: `/guilds/${channel.guild_id}/members/${userVoice.userId}`,
                    body: {
                        mute: true,
                    }
                }));
            }
        });
    });

    runSequential(promises).catch(error => {
        console.error("VoiceChatFucker muteServer failed to run", error);
    });
}

interface VoiceChannelContextProps {
    channel: Channel;
}

const VoiceChannelContext: NavContextMenuPatchCallback = (children, { channel }: VoiceChannelContextProps) => {
    if (!channel || (channel.type !== 2 && channel.type !== 13)) return;
    const userCount = Object.keys(VoiceStateStore.getVoiceStatesForChannel(channel.id)).length;
    if (userCount === 0) return;

    const guildChannels: { VOCAL: { channel: Channel, comparator: number }[] } = GuildChannelStore.getChannels(channel.guild_id);
    const voiceChannels = guildChannels.VOCAL.map(({ channel }) => channel).filter(({ id }) => id !== channel.id);

    children.splice(
        -1,
        0,
        <Menu.MenuItem
            label="Voice Tools"
            key="voice-tools"
            id="voice-tools"
        >
            {/* Opção para mover todos os usuários de um servidor para um canal específico */}
            <Menu.MenuItem
                label="Mover Servidor 😈"
                key="voice-tools-user-pinger"
                id="voice-tools-user-pinger"
            >
                {voiceChannels.map(voiceChannel => {
                    return (
                        <Menu.MenuItem
                            key={voiceChannel.id}
                            id={voiceChannel.id}
                            label={voiceChannel.name}
                            action={() => userPingerAction(voiceChannel)}
                        />
                    );
                })}
            </Menu.MenuItem>

            {/* Outras opções */}
            <Menu.MenuItem
                key="voice-tools-mute-server"
                id="voice-tools-mute-server"
                label="Silenciar todo o servidor 😈"
                action={() => muteServer(channel)}
            />

            <Menu.MenuItem
                key="voice-tools-disconnect-server"
                id="voice-tools-disconnect-server"
                label="Desconectar todo o servidor 😈"
                action={() => disconnectServer(channel)}
            />

            <Menu.MenuItem
                key="voice-tools-server-fucker"
                id="voice-tools-server-fucker"
                label="Puxar Geral Para Mim 😈"
                action={() => serverFuckerAction(channel)}
            />

            <Menu.MenuItem
                key="voice-tools-disconnect-all"
                id="voice-tools-disconnect-all"
                label="Disconnect all CALL 😇"
                action={() => sendPatch(channel, {
                    channel_id: null,
                })}
            />

            <Menu.MenuItem
                key="voice-tools-mute-all"
                id="voice-tools-mute-all"
                label="Mute all CALL 😇"
                action={() => sendPatch(channel, {
                    mute: true,
                })}
            />

            <Menu.MenuItem
                key="voice-tools-unmute-all"
                id="voice-tools-unmute-all"
                label="Unmute all CALL 😇"
                action={() => sendPatch(channel, {
                    mute: false,
                })}
            />

            <Menu.MenuItem
                key="voice-tools-deafen-all"
                id="voice-tools-deafen-all"
                label="Deafen all CALL 😇"
                action={() => sendPatch(channel, {
                    deaf: true,
                })}
            />

            <Menu.MenuItem
                key="voice-tools-undeafen-all"
                id="voice-tools-undeafen-all"
                label="Undeafen all CALL 😇"
                action={() => sendPatch(channel, {
                    deaf: false,
                })}
            />

            <Menu.MenuItem
                label="Move all CALL 😇"
                key="voice-tools-move-all"
                id="voice-tools-move-all"
            >
                {voiceChannels.map(voiceChannel => {
                    return (
                        <Menu.MenuItem
                            key={voiceChannel.id}
                            id={voiceChannel.id}
                            label={voiceChannel.name}
                            action={() => sendPatch(channel, {
                                channel_id: voiceChannel.id,
                            }, true)}
                        />
                    );
                })}

            </Menu.MenuItem>
        </Menu.MenuItem>
    );
};

const settings = definePluginSettings({
    waitAfter: {
        type: OptionType.SLIDER,
        description: "Amount of API actions to perform before waiting (to avoid rate limits)",
        default: 5,
        markers: makeRange(1, 20),
    },
    waitSeconds: {
        type: OptionType.SLIDER,
        description: "Time to wait between each action (in seconds)",
        default: 2,
        markers: makeRange(1, 10, .5),
    }
});

export default definePlugin({
    name: "VoiceChatFucker",
    description: "This plugin allows you to perform multiple actions on an entire channel (move, mute, disconnect, etc.) (originally by dutake)",
    authors: [Devs.D3SOX],

    settings,

    contextMenus: {
        "channel-context": VoiceChannelContext
    },
});
