import { ApiResponseDto } from '../dtos/api-response.dto';
import { SERVER_RESPONSE } from '../constants/server-response';

/**
 * Wraps controller return values in the standard success envelope.
 * Convention (§15): controllers always return via constructSuccessResponse.
 */
export function constructSuccessResponse<T>(
  data: T,
  message: string = SERVER_RESPONSE.SUCCESS,
): ApiResponseDto<T> {
  return new ApiResponseDto<T>(data, message);
}
