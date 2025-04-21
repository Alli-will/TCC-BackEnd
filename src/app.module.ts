import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/entity/user.entity';
import { AuthModule } from './auth/auth.module';
import { DiaryModule } from './DiaryEntry/diary.module';
import { DiaryEntry } from './DiaryEntry/entity/Diary.entity';
import { PostModule} from './post/posts.module';
import { Post } from './post/entity/post.entity'
import { ConsultModule } from './consul/consult.module';
import { Consult } from './consul/entity/consult.entity';
import { Comment } from './post/entity/comment.entity';
import { Like } from './post/entity/like.entity';


@Module({
  imports: [
    ConfigModule.forRoot(),
      TypeOrmModule.forRootAsync({
        imports:[ConfigModule],
        useFactory: (ConfigService: ConfigService) => ({
          type: 'postgres',
          host: ConfigService.get('DB_HOST'),
          port: +ConfigService.get('DB_PORT'),
          username: ConfigService.get('DB_USERNAME'),
          password: ConfigService.get('DB_PASSWORD'),
          database: ConfigService.get('DB_DATABASE'),
          entities: [User,DiaryEntry,Post,Consult,Comment,Like],
          synchronize: true,
        }),
        inject: [ConfigService],
    }), 
      UserModule,
      AuthModule,
      DiaryModule,
      PostModule,
      ConsultModule
  ],
  controllers: [AppController],
  providers: [AppService, ],


  
})

export class AppModule {}
