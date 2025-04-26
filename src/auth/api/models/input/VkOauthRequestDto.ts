import { IsString } from 'class-validator';

export class VkOauthRequestDto {
  @IsString()
  code: string;
}
