import { IsEnum } from 'class-validator';
import { ContactStatus } from '../interfaces/contact.interface';

export class UpdateContactStatusDto {
  @IsEnum(ContactStatus)
  status!: ContactStatus;
}
