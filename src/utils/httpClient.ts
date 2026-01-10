import axios from 'axios';
import axiosRetry from 'axios-retry';

const httpClient = axios.create({
    timeout: 10000,
});

axiosRetry(httpClient, {
    retries: 3,
    retryDelay: (retryCount) => {
        return retryCount * 1000; // 1s, 2s, 3s
    },
    retryCondition: (error) => {
        return (
            axiosRetry.isNetworkOrIdempotentRequestError(error) ||
            error.response?.status === 429
        );
    },
});

export default httpClient;
