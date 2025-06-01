import { EAccessObjectType } from '../../../db/entity';
import { TActionGrant } from '../../../utils';

export class AccessObjectCalculateRightsResponseDto {
  objectName: string;
  objectType: EAccessObjectType;
  actions: TActionGrant[];
  children: AccessObjectCalculateRightsResponseDto[];
}
