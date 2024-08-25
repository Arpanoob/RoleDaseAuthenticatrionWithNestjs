import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import { hash } from 'bcrypt';
import { Roles } from 'src/enum/roles.enum';
import { Approval } from './entities/approval.enity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Approval.name) private approvalModel: Model<Approval>,
  ) {}

  async create(createUserDto: CreateUserDto, rm: string) {
    console.log(createUserDto);
    if (!createUserDto.rm) createUserDto.rm = rm;
    const user = await new this.userModel(createUserDto);
    await user.save();
    console.log(user, 'user');
    return user;
  }
  async findUserByEmail(email: string) {
    console.log(await this.userModel.find({}), 'qwqw', email);
    return await this.userModel.findOne({ email }).select('+password');
  }

  findAll() {
    return `This action returns all user`;
  }

  async findUserById(id: string) {
    return await this.userModel.findOne({ _id: id });
  }

  async update(id: string, password: string) {
    console.log(id, password);
    if (!password) {
      throw new Error('Password is required');
    }
    password = await hash(password, +process.env.SALT || 10);
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      {
        password,
        isActive: true,
      },
      { new: true },
    );
    return updatedUser;
  }

  async findAllUsersWithRole(role: Roles, page: any, limit: any, curr: string) {
    console.log(curr);
    const [users, count] = await Promise.all([
      this.userModel
        .find({ _id: { $ne: curr } })
        .limit(limit)
        .skip((page - 1) * limit),
      this.userModel.countDocuments({ role }),
    ]);
    return {
      users,
      count,
    };
  }
  async asyncfindAllUsersForPerticularRm(
    id: string,
    page: any,
    limit: any,
  ): Promise<{ users: any; count: any } | { users: any; count: any }> {
    const [users, count] = await Promise.all([
      this.userModel
        .find({ rm: id })
        .limit(limit)
        .skip((page - 1) * limit),
      this.userModel.countDocuments({ rm: id }),
    ]);
    return {
      users,
      count,
    };
  }
  async UpdateApprovalForLeadAndWaitForManager(
    userId: string,
    salary: string,
    ApprovalId: string,
    manager: any,
  ) {
    console.log('kkkdffwefkkl', manager);

    const approval = await this.approvalModel.findOne({ _id: ApprovalId });
    if (approval) {
      approval.salary = salary;
      approval.approveByLead = true;
      approval.manager = manager;

      await approval.save();
      return;
    }
    console.log('kl', approval);

    const approveByLead = await new this.approvalModel({
      approveByLead: true,
      salary,
      manager,
    });

    await approveByLead.save();
    console.log('klo', approveByLead);

    await this.userModel.updateOne(
      { _id: userId },
      {
        Approvals: approveByLead._id,
      },
    );
  }
  async UpdateApprovalForMangerAndWaitForAdmin(
    userId: string,
    salary: string,
    ApprovalId: string,
  ) {
    console.log('opop');
    const approval = await this.approvalModel.findOne({ _id: ApprovalId });
    if (approval) {
      approval.salary = salary;
      approval.approveByManager = true;
      await approval.save();
      return;
    }

    const approveByManager = await new this.approvalModel({
      approveByManager: true,
      salary,
    });
    await approveByManager.save();

    await this.userModel.updateOne(
      { _id: userId },
      {
        Approvals: approveByManager._id,
      },
    );
  }
  async finalyUpdateSalary(userId: string, salary: string, ApprovalId: string) {
    const approval = await this.approvalModel.findOne({ _id: ApprovalId });
    console.log(salary);
    if (approval) {
      approval.approveByAdmin = true;
      approval.salary = salary;
      await approval.save();
      await this.userModel.updateOne(
        { _id: userId },
        {
          salary,
        },
      );
      return;
    }

    const approveByAdmin = new this.approvalModel({
      approveByAdmin: true,
      salary,
    });
    await approveByAdmin.save();
    console.log(salary, 'salaryy');
    await this.userModel.updateOne(
      { _id: userId },
      {
        salary,
        Approvals: approveByAdmin._id,
      },
    );
  }
  async findApprovalsByRolesAndRM(
    role: Roles,
    page: any,
    limit: any,
    id,
  ): Promise<any> {
    let AllAprovals = [];
    if (role === Roles.MANAGER)
      AllAprovals = await this.approvalModel.find({
        approveByLead: true,
      });
    // .select('_id');

    if (role === Roles.ADMIN)
      AllAprovals = await this.approvalModel.find({
        approveByManager: true,
      });
    //    .select('_id');
    const higher = AllAprovals.map((approval) => approval.manager);
    console.log('AllAprovals', AllAprovals);

    AllAprovals = AllAprovals.map((approval) => approval._id);

    console.log('AllAprovals', AllAprovals);
    console.log('higher', higher);

    const [users, count] = await Promise.all([
      this.userModel.aggregate([
        // Step 1: Match documents based on Approvals
        {
          $match: {
            Approvals: { $in: AllAprovals },
          },
        },
        // Step 2: Lookup to join Approvals details
        {
          $lookup: {
            from: 'approvals', // Collection name where Approval documents are stored
            localField: 'Approvals',
            foreignField: '_id',
            as: 'ApprovalsDetails',
          },
        },
        // Step 3: Unwind ApprovalsDetails to flatten the array
        {
          $unwind: '$ApprovalsDetails',
        },
        // Step 4: Match documents based on manager field in ApprovalsDetails
        {
          $match: {
            'ApprovalsDetails.manager': { $in: higher },
          },
        },
        // Step 5: Replace Approvals with ApprovalsDetails and remove ApprovalsDetails field
        {
          $addFields: {
            Approvals: '$ApprovalsDetails',
          },
        },
        {
          $project: {
            ApprovalsDetails: 0, // Exclude ApprovalsDetails from the output
          },
        },
        // Step 6: Group documents by their original _id to reassemble them
        {
          $group: {
            _id: '$_id',
            document: { $first: '$$ROOT' },
          },
        },
        // Step 7: Replace root with the updated document
        {
          $replaceRoot: { newRoot: '$document' },
        },
        // Step 8: Apply pagination
        {
          $limit: +limit,
        },
        {
          $skip: (page - 1) * limit,
        },
        // Step 9: Sort results by createdAt
        {
          $sort: { createdAt: -1 },
        },
      ]),
      this.userModel.countDocuments({
        Approval: { $in: AllAprovals },
      }),
    ]);
    console.log(users);
    return { users, count };
  }
  async findApprovalsByRoles(role: Roles, page: any, limit: any) {
    let AllAprovals = [];
    if (role === Roles.MANAGER)
      AllAprovals = await this.approvalModel.find({
        approveByLead: true,
      });

    if (role === Roles.ADMIN)
      AllAprovals = await this.approvalModel
        .find({
          approveByManager: true,
        })
        .select('_id');

    AllAprovals = AllAprovals.map((approval) => approval._id.toString());

    console.log('AllAprovals', AllAprovals);
    const [users, count] = await Promise.all([
      this.userModel
        .find({
          Approvals: { $in: AllAprovals },
        })
        .populate('Approvals')
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 }),
      this.userModel.countDocuments({
        Approval: { $in: AllAprovals },
      }),
    ]);
    console.log(users);
    return { users, count };
  }
  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
