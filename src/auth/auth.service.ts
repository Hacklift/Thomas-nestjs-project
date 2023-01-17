import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    //generate the password hash
    const hash = await argon.hash(dto.password);

    try {
      //save the new user in the database
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });

      return "Welcome, you are now a certified member of Benin's drugstore community";
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code == 'P2002') {
          throw new ForbiddenException('This email has already been used');
        }
      }
      throw error;
    }
  }

  async signin(dto: AuthDto) {
    //am finding the user with the email in the dto
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    //if the email is not found we throw an error
    if (!user) {
      throw new ForbiddenException('The email you privided is incorrect');
    }

    //comparison of password with argon
    const pwMatch = await argon.verify(user.hash, dto.password);
    if (!pwMatch) {
      // password did not match
      throw new ForbiddenException('The password you provided is incorrect');
    } else {
      // password  match
      return this.signToken(user.id, user.email);
    }
  }

  //This generates a token that is going to be used to enable the
  // to have access to protected routes like a "/users/me" route
  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };

    const secret = this.config.get('JWT_SECRET');
    const access_token = await this.jwt.signAsync(payload, {
      expiresIn: '10m',
      secret: secret,
    });

    return {
      access_token,
    };
  }
}
