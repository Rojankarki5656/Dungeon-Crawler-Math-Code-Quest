import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  email!: string;

  @IsString()
  @Length(8, 72, { message: 'PASSWORD_LENGTH_8_72' })
  password!: string;

  @IsString()
  @Length(3, 20, { message: 'PLAYER_NAME_LENGTH_3_20' })
  @Matches(/^[A-Za-z0-9_\-]+$/, { message: 'PLAYER_NAME_INVALID_CHARS' })
  playerName!: string;
}