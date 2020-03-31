import {AfterViewChecked, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {BehaviorSubject, Observable} from 'rxjs';
import {MessageModel} from './models/message.model';
import {map, tap} from 'rxjs/operators';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewChecked {

  @ViewChild('chat_list', {static: false}) chat: ElementRef;

  title = 'bezimienni-chat';
  items$: Observable<MessageModel[]>;

  message: string;
  nick: string;

  login$: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(private firebase: AngularFirestore) {
    this.items$ = firebase.collection<MessageModel>('messages').valueChanges().pipe(
      map(r => {
        return r.sort((a: MessageModel, b: MessageModel) => {

          return a.sendDate.seconds > b.sendDate.seconds ? 1 : a.sendDate.seconds < b.sendDate.seconds ? -1 : 0;
        });
      }),
      tap(() => {
        this.chat.nativeElement.scrollTop = this.chat.nativeElement.scrollHeight;
      })
    );
  }

  ngOnInit(): void {
    const user = localStorage.getItem('login');
    if (user !== null) {
      this.login$.next(user);
    }
  }

  ngAfterViewChecked(): void {
    this.chat.nativeElement.scrollTop = this.chat.nativeElement.scrollHeight;
  }

  async addMessage() {
    if (this.message.length === 0) {
      return;
    }

    await this.firebase.collection<MessageModel>('messages').add({
      message: this.message,
      user: this.login$.getValue(),
      sendDate: moment().toDate(),
    });

    this.message = '';
  }

  saveNick() {
    localStorage.setItem('login', this.nick);
    this.login$.next(this.nick);
    this.nick = '';
  }

  keypress(e) {
    if (e.key === 'Enter') {
      this.addMessage();
    }
  }
}
