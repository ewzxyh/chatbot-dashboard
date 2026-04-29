import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Location } from '@angular/common';
import { ProjectPlanService } from '../services/project-plan.service';
import { LoggerService } from '../services/logger/logger.service';
import { PLAN_NAME } from 'app/utils/util';
import { UsersService } from 'app/services/users.service';
import { AuthService } from './auth.service';

@Injectable()
export class ProjectProfileGuard implements CanActivate {
  userIsAuthorized: boolean;
  PLAN_NAME = PLAN_NAME;
  USER_ROLE: string
  userId: string
  constructor(
    private router: Router,
    public location: Location,
    private prjctPlanService: ProjectPlanService,
    private logger: LoggerService,
    private usersService: UsersService,
    public auth: AuthService,
  ) {
    this.logger.log('[PROJECT-PROFILE-GUARD] HELLO !!!')
   
  }



  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

    // this.auth.user_bs
    // .subscribe((user) => {
    //   console.log('[PROJECT-PROFILE-GUARD] - user ', user)


    //   if (user) {
      
    //     this.userId = user._id
    //     console.log('[PROJECT-PROFILE-GUARD] - userId ', this.userId)
    //   }
    // })
    // this.logger.log('[PROJECT-PROFILE-GUARD]  canActivate next ', next)
    // this.logger.log('[PROJECT-PROFILE-GUARD]  canActivate state ', state)
    const prjct_id = next.params.projectid;
    // this.logger.log('[PROJECT-PROFILE-GUARD] GUARD canActivate next > ****** PRJCT ID ****** ', prjct_id)

    const url = state.url;
    // console.log('[PROJECT-PROFILE-GUARD] canActivate state > ****** URL ****** ', url);


    const project = await this.prjctPlanService._getProjectById(prjct_id);
    this.logger.log('[PROJECT-PROFILE-GUARD] (NEW WF) checkProjectPlan > ****** project ****** ', project)

  

    const type = project['profile'].type;
    const planName = project['profile'].name;
    const isActiveSubscription = project['isActiveSubscription'];
    const trialExpired = project['trialExpired'];

    this.logger.log('[PROJECT-PROFILE-GUARD] (NEW WF) Plan * type * ', type);
    this.logger.log('[PROJECT-PROFILE-GUARD] (NEW WF) Plan * planName * ', planName);
    this.logger.log('[PROJECT-PROFILE-GUARD] (NEW WF) Plan * isActiveSubscription * ', isActiveSubscription);
    this.logger.log('[PROJECT-PROFILE-GUARD] (NEW WF) Plan * trialExpired * ', trialExpired);


    if (type === 'free') {
      if (trialExpired === true) {
        this.userIsAuthorized = false;
      } else if (trialExpired === false) {
        this.userIsAuthorized = true;
      }
    }

    if (type === 'payment') {
      if (isActiveSubscription === true) {
        this.userIsAuthorized = true;
      } else if (isActiveSubscription === false) {
        this.logger.log('[PROJECT-PROFILE-GUARD] -> (NEW WF) isActiveSubscription 2', isActiveSubscription);
        this.userIsAuthorized = false;
      }
    }

    
    if (this.userIsAuthorized === true) {
      return true
      // if (this.userIsAuthorized === false &&  userRole !== 'agent')
    } else {
      this.logger.log('[PROJECT-PROFILE-GUARD] USER NOT AUTHORIZED - URL ', url);
      this.router.navigate([url + '-demo']);
      return false
    }


    // if (this.userIsAuthorized === true) {
    //   return true
    // } else if (this.userIsAuthorized === false && this.USER_ROLE !== 'agent' ){
    //   // console.log('[PROJECT-PROFILE-GUARD] USER NOT AUTHORIZED - URL ', url);
    //   console.log('[PROJECT-PROFILE-GUARD] YERE GO TO DEMO USER_ROLE ', this.USER_ROLE);
    //   this.router.navigate([url + '-demo']);
    //   return false
    // }

  }

}
