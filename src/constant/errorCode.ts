
export const ERROR_CODE_CONFIG = {
    NOT_FOUND_BRANCH: {
        code: 1000,
        message: '没有找到分支{branch}',
    },
    NOT_FOUND_PREVIOUS_BRANCH: {
        code: 1001,
        message: '未找到符合条件的上一次分支',
    },
    FIND_AND_DIFF_BRANCHES: {
        code: 1002,
        message: '查找和比较分支时出错: {message}',
    },
    QUERY_LOG_PARAMS_ERROR: {
        code: 1003,
        message: '请至少提供用户id、api请求的path、错误码、页面url、api错误原因之一用于排查',
    },
    EVENT_ID_NOT_FOUND: {
        code: 1004,
        message: '没有找到eventId: {eventId}',
    },
    RULIU_ENCODING_AES_KEY: {
        code: 1005,
        message: '请设置RULIU_ENCODING_AES_KEY',
    },
    METHOD_NOT_ALLOWED: {
        code: 1006,
        message: '不支持的请求方法: {method}',
    },
    SIGNATURE_INVALID: {
        code: 1007,
        message: '签名验证失败',
    },
    RULIU_ACCESS_TOKEN_NOT_SET: {
        code: 1008,
        message: '请设置RULIU_ACCESS_TOKEN',
    },
    RULIU_WEB_HOOK_NOT_SET: {
        code: 1009,
        message: '请设置RULIU_WEB_HOOK',
    },
    OPENAI_ERROR: {
        code: 1010,
        message: 'chat调用失败: {message}',
    },
    ZHENDUAN_ERROR: {
        code: 1011,
        message: '查询错误失败: {message}',
    },
    PAICHA_ERROR: {
        code: 1012,
        message: '查询排查兔失败: {message}',
    },
    FUNCTION_NOT_FOUND: {
        code: 1013,
        message: '没有找到函数: {functionName}',
    },
    ZHI_BAN_ERROR: {
        code: 1014,
        message: '查询值班表失败: {message}',
    },

    OKR_PEER_ERROR: {
        code: 1015,
        message: '查询okr peer失败: {message}',
    },
} as const;

type ApiErrorName = keyof typeof ERROR_CODE_CONFIG;

type ExtractPlaceholders<S extends string> = S extends `${infer _}{${infer P}}${infer Rest}`
    ? P | ExtractPlaceholders<Rest>
    : never;

type RequiredParams<T extends ApiErrorName> = ExtractPlaceholders<typeof ERROR_CODE_CONFIG[T]['message']> extends never
    ? undefined
    : Pretty<Record<
    ExtractPlaceholders<typeof ERROR_CODE_CONFIG[T]['message']>,
    string
    >>;

type ErrorParams<T extends ApiErrorName> = RequiredParams<T>;


type Pretty<T> = {
    [K in keyof T]: T[K];
};


type ApiErrorNameWithParams = {
    [K in ApiErrorName]: ErrorParams<K> extends undefined ? never : K;
}[ApiErrorName];

type ApiErrorNameWithoutParams = {
    [K in ApiErrorName]: ErrorParams<K> extends undefined ? K : never;
}[ApiErrorName];


export function throwApiError<T extends ApiErrorNameWithoutParams>(
    errorName: T,
): never;
export function throwApiError<T extends ApiErrorNameWithParams>(
    errorName: T,
    params: ErrorParams<T>
): never;
export function throwApiError<T extends ApiErrorName>(
    errorName: T,
    params?: ErrorParams<T>
): never {
    const error = ERROR_CODE_CONFIG[errorName];
    if (!params) {
        throw {
            code: error.code,
            message: error.message,
        };
    }
    const message = error.message.replace(/{(\w+)}/g, (_, key) => (params as any)?.[key]);

    throw {
        code: error.code,
        message,
    };
}

