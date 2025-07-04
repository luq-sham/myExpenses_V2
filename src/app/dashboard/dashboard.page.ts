import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonCard, IonContent, IonCardContent, IonRow, IonCol, IonIcon, IonAvatar, IonSkeletonText, IonItem, IonLabel, IonNote, IonList, IonProgressBar, IonCardHeader, IonCardTitle, IonRippleEffect, IonGrid, IonRefresher, IonRefresherContent, IonBadge, IonChip, IonFab, IonFabButton, IonFabList } from '@ionic/angular/standalone';
import { MenuController } from '@ionic/angular/standalone';
import { HeaderComponent } from '../components/header/header.component';
import { ApiService } from '../services/api.service';

import { Router } from '@angular/router';
import { AlertService } from '../services/alert.service';
import { ModalController } from '@ionic/angular/standalone';
import { AddComponent } from '../forms/add/add.component';
import { AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import Chart from 'chart.js/auto';
import { style } from '@angular/animations';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonFabList, IonFabButton, IonFab, IonChip,  IonBadge, IonRefresherContent, IonRefresher, IonGrid, IonRippleEffect, IonCardTitle, IonCardHeader, IonProgressBar, IonList, IonNote, IonLabel, IonItem, IonSkeletonText, IonAvatar, IonIcon, IonCol, IonRow, IonCardContent, IonCard, IonContent, CommonModule, FormsModule, HeaderComponent,  ],
})
export class DashboardPage {
  doughnutChart: any;
  data: any[] = [];
  password: string = '';
  email: string = '';
  param: any = {};
  dataCerdencial: any;

  monthlyExpenses:any
  totalCount: any;
  total_expenses:any;
  show_expenses:boolean = false;
  show_expenses_label = 'Show More'

  loading_account: boolean = true;
  loading_transaction: boolean = true;
  loading_budget: boolean = true;
  loading_chart: boolean = true;

  account_list: any[] = [];
  transactions: any[] = [];
  budgets: any[] = [];

  private firstEnter = true;

  acc_id: any = '';

  @ViewChild('barCanvas', { static: false }) barCanvas!: ElementRef<HTMLCanvasElement>;
  barChart: any;

  constructor(
    private menu: MenuController,
    private router: Router,
    private api: ApiService,
    private alert: AlertService,
    private modal: ModalController
  ) {}

  ngOnInit() {
    this.getData();
  }

  getData() {
    this.loading_account = true;
    this.loading_transaction = true;
    this.loading_budget = true;

    const token = {
      user_id: localStorage.getItem('token'),
    };

    // Accounts API
    this.api.getAccountByUser(token).subscribe({
      next: async (res) => {
        if (res.status_code == 200) {
          this.loading_account = false;
          this.account_list = res.return_data;
        }
      },
      error: async () => {
        this.alert.customAlert(
          'Loading Failed',
          'An error has occurred. Kindly try again.(account)'
        );
      },
    });

    // Transactions API
    this.api.getTransaction(token).subscribe({
      next: async (res) => {
        if (res.status_code == 200) {
          this.loading_transaction = false;
          this.transactions = res.return_data;
        }
      },
      error: async () => {
        this.alert.customAlert(
          'Loading Failed',
          'An error has occurred. Kindly try again.(transaction)'
        );
      },
    });

    // Budgets API
    this.api.getBudgetByUserFilter(token).subscribe({
      next: async (res) => {
        if (res.status_code == 200) {
          this.loading_budget = false;
          this.budgets = res.return_data;
        }
      },
      error: async () => {
        this.alert.customAlert(
          'Loading Failed',
          'An error has occurred. Kindly try again.(budget)'
        );
      },
    });

    //Transaction Chart
    this.api.getTransactionChart(token).subscribe((res: any) => {
      this. loading_chart = false
      this.totalCount = res.totalCount
      this.monthlyExpenses = res.chart_data;
      this.total_expenses = res.total_expenses
      const labels = this.monthlyExpenses.map((item: any) => item.category);
      const data = this.monthlyExpenses.map((item: any) => item.total);

      if(this.totalCount > 0){
        this.renderChart(labels, data,this.total_expenses);
      }
    });
  }

  renderChart(labels: any, data: any, total_expenses: any) {
    if (this.barChart) {
      this.barChart.destroy();
    }
    
    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Sales',
            data: data,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: 'Total Expenses: '+ total_expenses.toLocaleString('en-MY',{style:'currency', currency: 'MYR'}),
            font: {
              size: 18,
              weight: 'bold',
            },
          },
          tooltip: {
            callbacks: {
              label: function (context: any) {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value.toLocaleString('en-MY', {
                  style: 'currency',
                  currency: 'MYR',
                })}`;
              },
            },
          },
        },
      },
    });
  }

  async addAccount() {
    const param = {
      formID: 1,
      title: 'New Account',
    };
    const modal = await this.modal.create({
      component: AddComponent,
      componentProps: param,
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data) {
      this.getData();
    }
  }

  openBudget(budget: any) {
    this.router.navigate(['/budget-detail'], { queryParams: { id: budget.id } });
    console.log(budget);
  }

  getProgressColor(amount: any, total:any): string {
    const progress = amount / total;
    if (progress < 0.5) return 'success';
    else if (progress < 0.9) return 'warning';
    else return 'danger';
  }

  transactionsList() {
    this.router.navigate(['/transactions']);
  }

  budgetsList() {
    this.router.navigate(['/budgets']);
  }

  handleRefresh(event: any) {
    setTimeout(() => {
      event.target.complete();
      window.location.reload();
    }, 1000);
  }

  expensesList(){
    this.show_expenses = !this.show_expenses
    if(this.show_expenses == true){
      this.show_expenses_label = 'Show Less'
    }else{
      this.show_expenses_label = 'Show More'
    }
  }

  openAccountDetails(account: any) {
    this.router.navigate(['/account-detail'], { queryParams: { id: account} });
  }

  openTransactionDetails(transaction: any){
    this.router.navigate(['/transaction-detail'], { queryParams: { id: transaction } });
  }

  async addExpensesModal(){
    const param={
      formID:2,
      title:'New Transactions'
    }

    const modal = await this.modal.create({
      component:AddComponent,
      componentProps:param
    })

    await modal.present()
    const {data} = await modal.onDidDismiss()

    if(data){
      this.getData();
    }

  }

  ionViewWillEnter() {
    if (this.firstEnter) {
      this.firstEnter = false;
      return;
    }
    this.getData();
  }
}
