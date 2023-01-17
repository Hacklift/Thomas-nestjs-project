import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { EditDto } from './dto';
import { UserService } from './user.service';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UserController {
  constructor(private userservice: UserService) {}

  @Get('me')
  getme(@Req() req: Request) {
    const email =  Object.values(req.user)[3];
    const firstname =  Object.values(req.user)[4];
    const lastname =  Object.values(req.user)[5];

     return {
     email,
     firstname,
     lastname,
    };
  }

  @Patch('edit')
  edituser(@Req() req: Request, @Body() dto: EditDto) {
    const userId = Object.values(req.user)[0];
    return this.userservice.editUser(userId, dto);
  }
}
