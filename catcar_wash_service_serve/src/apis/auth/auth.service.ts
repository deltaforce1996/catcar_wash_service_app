import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { BcryptService } from 'src/services/bcrypt.service';
import { EmpStatus, PermissionType, tbl_emps, tbl_users, UserStatus } from '@prisma/client';
import { ItemNotFoundException } from 'src/errors';
import { AuthenticatedUser, JwtPayload } from 'src/types/internal.type';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly bcryptService: BcryptService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private userAuthQuery = {
    id: true,
    email: true,
    fullname: true,
    password: true,
    permission: { select: { id: true, name: true } },
    status: true,
  };

  private employeeAuthQuery = {
    id: true,
    email: true,
    name: true,
    password: true,
    permission: { select: { id: true, name: true } },
    status: true,
  };

  async validateUserById(id: string): Promise<AuthenticatedUser | undefined> {
    const user = await this.prisma.tbl_users.findUnique({
      where: { id, status: UserStatus.ACTIVE },
      select: this.userAuthQuery,
    });
    if (user && user.permission) {
      return {
        id: user.id,
        email: user.email,
        name: user.fullname,
        permission: {
          id: user.permission.id,
          name: user.permission.name,
        },
        status: user.status,
      };
    }
  }

  async validateEmployeeById(id: string): Promise<AuthenticatedUser | undefined> {
    const employee = await this.prisma.tbl_emps.findUnique({
      where: { id, status: EmpStatus.ACTIVE },
      select: this.employeeAuthQuery,
    });
    if (employee && employee.permission) {
      return {
        id: employee.id,
        email: employee.email,
        name: employee.name,
        permission: {
          id: employee.permission.id,
          name: employee.permission.name,
        },
        status: employee.status,
      };
    }
  }

  async validateUserByEmail(email: string, password: string): Promise<AuthenticatedUser | undefined> {
    const user = await this.prisma.tbl_users.findUnique({
      where: { email, status: UserStatus.ACTIVE },
      select: this.userAuthQuery,
    });
    if (user && user.permission) {
      const isPasswordValid = await this.bcryptService.comparePassword(password, user.password);
      if (isPasswordValid) {
        return {
          id: user.id,
          email: user.email,
          name: user.fullname,
          permission: {
            id: user.permission.id,
            name: user.permission.name,
          },
          status: user.status,
        };
      }
    }
  }

  async validateEmployeeByEmail(email: string, password: string): Promise<AuthenticatedUser | undefined> {
    const employee = await this.prisma.tbl_emps.findUnique({
      where: { email, status: EmpStatus.ACTIVE },
      select: this.employeeAuthQuery,
    });
    if (employee && employee.permission) {
      const isPasswordValid = await this.bcryptService.comparePassword(password, employee.password);
      if (isPasswordValid) {
        return {
          id: employee.id,
          email: employee.email,
          name: employee.name,
          permission: {
            id: employee.permission.id,
            name: employee.permission.name,
          },
          status: employee.status,
        };
      }
    }
  }

  async registerUser(user: { fullname: string; email: string; password: string }): Promise<tbl_users> {
    const hashedPassword = await this.bcryptService.hashPassword(user.password);
    const permission = await this.prisma.tbl_permissions.findUnique({
      where: { name: PermissionType.USER },
    });
    if (!permission) {
      throw new ItemNotFoundException('Permission not found');
    }
    const newUser = await this.prisma.tbl_users.create({
      data: {
        fullname: user.fullname,
        email: user.email,
        password: hashedPassword,
        permission_id: permission.id,
        status: UserStatus.ACTIVE,
      },
    });
    return newUser;
  }

  async registerEmployee(employee: { name: string; email: string; password: string }): Promise<tbl_emps> {
    const hashedPassword = await this.bcryptService.hashPassword(employee.password);
    const permission = await this.prisma.tbl_permissions.findUnique({
      where: { name: PermissionType.TECHNICIAN },
    });
    if (!permission) {
      throw new ItemNotFoundException('Permission not found');
    }
    const newEmployee = await this.prisma.tbl_emps.create({
      data: {
        name: employee.name,
        email: employee.email,
        password: hashedPassword,
        permission_id: permission.id,
        status: EmpStatus.ACTIVE,
      },
    });
    return newEmployee;
  }

  issueToken(user: AuthenticatedUser): string {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      permission: user.permission,
      status: user.status,
      iat: Date.now(),
    };
    return this.jwtService.sign(payload);
  }
}
