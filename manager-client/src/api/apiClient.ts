import { GLOBAL_CONFIG } from "@/global-config";
import { t } from "@/locales/i18n";
import userStore from "@/store/userStore";
import axios, { type AxiosRequestConfig, type AxiosError, type AxiosResponse } from "axios";
import { toast } from "sonner";
import type { Result } from "#/api";
import { ResultStatus } from "#/enum";

const axiosInstance = axios.create({
	baseURL: GLOBAL_CONFIG.apiBaseUrl,
	timeout: 50000,
	headers: { "Content-Type": "application/json;charset=utf-8" },
});

axiosInstance.interceptors.request.use(
	(config) => {
		config.headers.Authorization = "Bearer Token";
		return config;
	},
	(error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
	(res: AxiosResponse<Result<any>>) => {
		if (!res.data) {
			// Log full response for debugging when backend returns no JSON body
			// (helps diagnose CORS, proxy or server errors during development)
			// eslint-disable-next-line no-console
			console.error("apiClient: empty response:", res);
			throw new Error(`${t("sys.api.apiRequestFailed")} (status: ${res.status})`);
		}

		// If backend returns a raw auth/token object (not wrapped in Result<>)
		// return it directly so endpoints like /auth/local/login work.
		if (
			typeof res.data === "object" &&
			("accessToken" in res.data || "refreshToken" in res.data || "user" in res.data)
		) {
			return res.data as any;
		}

		const { status, data, message } = res.data as any;
		if (status === ResultStatus.SUCCESS) {
			return data;
		}
		throw new Error(message || t("sys.api.apiRequestFailed"));
	},
	(error: AxiosError<Result>) => {
		const { response, message } = error || {};
		const errMsg = response?.data?.message || message || t("sys.api.errorMessage");
		toast.error(errMsg, { position: "top-center" });
		if (response?.status === 401) {
			userStore.getState().actions.clearUserInfoAndToken();
		}
		return Promise.reject(error);
	},
);

class APIClient {
	get<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "GET" });
	}
	post<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "POST" });
	}
	put<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "PUT" });
	}
	delete<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "DELETE" });
	}
	request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return axiosInstance.request<any, T>(config);
	}
}

export default new APIClient();
