'use client';

import { useCallback, useState } from 'react';

import {
    Flex,
    Radio,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    Title,
} from '@mantine/core';

import { decode, encode } from '@/lib/encoders/base64';

type Mode = 'encode' | 'decode';

export default function Page() {
    const [mode, setMode] = useState<Mode>('encode');
    const [inputText, setInputText] = useState<string>('');
    const [outputText, setOutputText] = useState<string>('');

    const handleInputTextChange = useCallback(
        (input: string) => {
            setInputText(input);
            switch (mode) {
                case 'encode':
                    setOutputText(encode(input));
                    break;
                case 'decode':
                    setOutputText(decode(input));
                    break;
            }
        },
        [mode]
    );

    const handleModeChange = useCallback((newMode: string) => {
        setMode(newMode as Mode);
        setInputText('');
        setOutputText('');
    }, []);

    return (
        <Stack gap='xl'>
            <Stack gap='sm'>
                <Title order={2}>Base64 Encoder/Decoder</Title>
                <Text c='dimmed' size='sm'>
                    In order to use your Lua code in the game, it needs to be
                    encoded in Base64 format. Use this tool to encode or decode
                    Base64 strings.
                </Text>
            </Stack>

            <Stack>
                <Radio.Group value={mode} onChange={handleModeChange}>
                    <Flex gap='md'>
                        <Radio value='encode' label='Encode' />
                        <Radio value='decode' label='Decode' />
                    </Flex>
                </Radio.Group>

                <SimpleGrid cols={2}>
                    <Textarea
                        label='Input'
                        placeholder='Your text goes here'
                        value={inputText}
                        onChange={(event) =>
                            handleInputTextChange(event.currentTarget.value)
                        }
                        autosize
                        maxRows={17}
                    />
                    <Textarea
                        label='Output'
                        placeholder='Generated text will be here'
                        readOnly
                        value={outputText}
                        autosize
                        maxRows={17}
                    />
                </SimpleGrid>
            </Stack>
        </Stack>
    );
}
