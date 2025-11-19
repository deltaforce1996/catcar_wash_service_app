import type {
  ApiSuccessResponse,
  PromotionResponseApi,
  CreatePromotionPayload,
  UpdatePromotionPayload,
  SearchPromotionsRequest,
  PaginatedPromotionResponse,
} from "~/types";
import { BaseApiClient } from "../bases/base-api-client";

export class PromotionApiService extends BaseApiClient {
  private convertQueryToParams(query: SearchPromotionsRequest["query"]): string {
    if (!query) return "";
    const parts: string[] = [];
    for (const [key, value] of Object.entries(query)) {
      if (value != null && value !== "" && String(value).trim().toUpperCase() !== "ALL") {
        parts.push(`${key}: {${value}}`);
      }
    }
    return parts.join(" ");
  }

  async SearchPromotions(
    payload: SearchPromotionsRequest
  ): Promise<ApiSuccessResponse<PaginatedPromotionResponse>> {
    const response = await this.get<ApiSuccessResponse<PaginatedPromotionResponse>>(
      "api/v1/promotions/search",
      {
        params: {
          query: this.convertQueryToParams(payload.query),
          page: payload.page,
          limit: payload.limit,
          sort_by: payload.sort_by,
          sort_order: payload.sort_order,
        },
      }
    );

    return response;
  }

  async GetPromotionById(id: string): Promise<ApiSuccessResponse<PromotionResponseApi>> {
    const response = await this.get<ApiSuccessResponse<PromotionResponseApi>>(
      `api/v1/promotions/find-by-id/${id}`
    );

    return response;
  }

  async CreatePromotion(
    payload: CreatePromotionPayload
  ): Promise<ApiSuccessResponse<PromotionResponseApi>> {
    const response = await this.post<ApiSuccessResponse<PromotionResponseApi>>(
      "api/v1/promotions/create",
      payload
    );

    return response;
  }

  async UpdatePromotion(
    id: string,
    payload: UpdatePromotionPayload
  ): Promise<ApiSuccessResponse<PromotionResponseApi>> {
    const response = await this.put<ApiSuccessResponse<PromotionResponseApi>>(
      `api/v1/promotions/update-by-id/${id}`,
      payload
    );

    return response;
  }
}
