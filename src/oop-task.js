class EventManager {// класс для создания менеджеров событий
  constructor(...events) {
    this.listeners = new Map();
    events.forEach((event) => this.listeners.set(event, []));
  }

  subscribe(event, ...listeners) { // подписать на событие
    listeners.forEach((listener) => this.listeners.get(event).push(listener));
  }

  unsubscribe(event, listener) { // отписать от события
    // eslint-disable-next-line max-len
    const listeners = this.listeners.get(event).filter((curent) => curent !== listener);
    this.listeners.set(event, listeners);
  }

  notify(event, data) { // уведомить подписчиков
    this.listeners.get(event).forEach((listener) => listener.update(data));
  }
}

class Company {
  constructor(manager) {
    this.eventManager = manager; // менеджер событий(шаблон наблюдатель - издатель будет опевещать подписчиков о событиях)
    this.employedDevs = 0;// принятые программисты
    this.dismissedDevs = 0;// уволенные программисты
    this.doneProjects = 0;// кол-во выполненых проектов
    this.departments = [];
    this.newProjects = [];
    this.boss = null;
  }

  unsubscribe(event, listener) { // метод для отписывания подписчика события
    this.eventManager.unsubscribe(event, listener);
  }

  setBoss(boss) {
    // eslint-disable-next-line no-use-before-define
    if (boss instanceof Boss) {
      this.boss = boss;
      this.boss.setCompany(this);
      this.departments.forEach((dep) => {
        dep.setBoss(boss);
        this.boss.addDepartment(dep);
      });
      this.eventManager.subscribe('generate', this.boss);
    }
  }

  generateNewProjs() { // компания получает новые проекты
    const countNewProj = Math.floor((Math.random() * 4) + 1);
    // eslint-disable-next-line vars-on-top
    // eslint-disable-next-line no-plusplus
    for (let j = 0; j < countNewProj; j++) {
      // eslint-disable-next-line no-use-before-define
      this.newProjects.push(new Project(this.boss));
    }
    this.eventManager.subscribe('inc_day', ...this.newProjects); // подписываем проекты на событие 'inc_day' - увеличение дня
    this.eventManager.notify('generate', this.newProjects); // уведомляем директора о новых проектах
    this.newProjects = []; // сбрасываем новые проекты
  }

  incDay() { // добавляем день
    this.eventManager.notify('inc_day', null); // уведомляем подписчиков
  }

  incEmployedDevs() { // увеличиваем кол-во нанятых программистов
    this.employedDevs += 1;
  }

  addDepartment(dep) { // добавляем департамент
    this.departments.push(dep);
    this.boss.addDepartment(dep);
    dep.setBoss(this.boss);
    this.eventManager.subscribe('inc_day', dep); // подписываем департамент на событие
  }

  getEmployedDevs() {
    return this.employedDevs;
  }

  incDismissedDevs() { // увеличиваем кол-во уволенных программистов
    this.dismissedDevs += 1;
  }

  getDismissedDevs() {
    return this.dismissedDevs;
  }

  incDoneProjects() { // увеличиваем число выполненых проектов на 1
    this.doneProjects += 1;
  }

  getDoneProjects() {
    return this.doneProjects;
  }
}

class Boss { // директор выступит в качестве посредника
  constructor() {
    this.projsInDevelopment = new Map(); // коллекция для группировки проектов с разработчиками(ключ - проект, значение ключа - разработчики)
    this.remainingProjects = [];
    this.departments = [];
    this.projectsToTest = [];
    this.company = null;
  }

  setCompany(company) {
    this.company = company;
  }

  joinDevToProj(dev, proj) { // добавляем разработчика к проекту
    proj.stopWaiting();
    if (this.projsInDevelopment.has(proj)) { // если уже есть такой проект, то просто добавляем разработчика
      this.projsInDevelopment.get(proj).push(dev);
    } else { // иначе создаем новую пару
      this.projsInDevelopment.set(proj, [dev]);
    }
  }

  incDismissedDevs() {
    this.company.incDismissedDevs();
  }

  removeProject(proj) { // удаляем проект
    const devs = this.projsInDevelopment.get(proj);
    devs.forEach((dev) => dev.setFree());
    this.projsInDevelopment.delete(proj);
    this.company.unsubscribe('inc_day', proj); // отписываем от события
    this.company.incDoneProjects();
  }

  addDepartment(dep) {
    this.departments.push(dep);
  }

  addRemainingProjs(projects) { // добавляем оставшийся проект
    this.remainingProjects = this.remainingProjects.concat(projects);
    projects.forEach((proj) => proj.wait()); // ожидают разработчика
  }

  update(data) { // обрабатываем оповешение о событие
    if (this.remainingProjects.length) { // если есть оставшиеся проекты, то
      this.employDevs();// нанимаем новых разработчиков
      this.distrProjects(this.remainingProjects);
      this.remainingProjects = [];
    }
    const projects = data.concat(this.projectsToTest); // распределяем новые проекты и проекты для тестирования
    this.projectsToTest = [];
    this.distrProjects(projects);
  }

  distrProjects(projectsToDistr) { // распределяем проекты
    this.departments.forEach((dep) => {
      // eslint-disable-next-line max-len
      const projects = projectsToDistr.filter((proj) => proj.getType() === dep.getName());
      dep.distributeByDevs(projects);
    });
  }

  addProjectToTest(project) { // добавляем проект готовый к тестированию
    this.projectsToTest.push(project);
  }

  employDevs() { // нанимаем новых программистов для реализации оставшихся проектов
    this.departments.forEach((dep) => {
      // eslint-disable-next-line max-len
      const projects = this.remainingProjects.filter((rProj) => rProj.getType() === dep.getName());
      projects.forEach(() => dep.addDeveloper()); // шаблон фабричный метод(добавит каждому отделу соответствующего разработчика)
      this.company.incEmployedDevs();
    });
  }
}

class Project {
  constructor(boss) {
    this.boss = boss; // директор - посредник
    this.complexity = Math.floor(Math.random() * 3 + 1); // сложность проекта
    this.type = Math.floor(Math.random() * 2 + 1) === 1 ? 'web' : 'mobile'; // тип проекта
    this.daysOfDevelopment = 0; // текущее кол-во дней на разработке
    this.countDevs = 0;
    this.waiting = true; // есле не поступил на разработку, то не будет увеличивать текущее кол-во дней на разработке при оповещении
  }

  wait() { //
    this.waiting = true;
  }

  stopWaiting() {
    this.waiting = false;
  }

  isWaiting() {
    return this.waiting;
  }

  getComplexity() {
    return this.complexity;
  }

  getType() {
    return this.type;
  }

  setType(type) {
    this.type = type;
  }

  incCountDevelopers() { // увеличить число программистов разрабатывающих проект
    this.countDevs += 1;
  }

  getCountDevelopers() {
    return this.countDevs;
  }

  getTimeToDo() { // количество дней для выполнения проекта
    return Math.ceil(this.complexity / this.countDevs);
  }

  update() { // обрабатываем оповешение от издателя
    if (!this.isWaiting()) {
      this.daysOfDevelopment += 1;
      if (!(this.getType() === 'qa')) {
        if (this.getTimeToDo() === this.daysOfDevelopment) {
          this.setType('qa');
          this.wait(); // ожидает тестировщика
          this.daysOfDevelopment = 0;
          this.boss.addProjectToTest(this);
        }
      } else if (this.daysOfDevelopment === 1) {
        this.boss.removeProject(this); // удаляем готовый проект
      }
    }
  }
}

class Developer {
  constructor(profession) {
    this.profession = profession; // специальность
    this.freeDays = 0; // кол-во свободных дней
    this.countDoneProjects = 0; // кол-во готовых проектов
    this.free = true; // занят или нет
  }

  incDay() { // увеличиваем свободные дни
    if (this.isFree()) {
      this.freeDays += 1;
    }
  }

  setProject() {
    this.free = false;
    this.freeDays = 0;
  }

  setFree() {
    this.free = true;
    this.countDoneProjects += 1;
  }

  getCountDoneProjects() {
    return this.countDoneProjects;
  }

  isFree() {
    return this.free;
  }

  getFreeDays() {
    return this.freeDays;
  }
}

class Department {
  constructor() {
    this.developers = []; // разработчики
    this.boss = null;
  }

  setBoss(boss) {
    this.boss = boss;
  }

  update() { // обрабатываем оповещение от издателя
    this.checkDevsToDismiss();
    this.developers.forEach((dev) => dev.incDay());
  }

  checkDevsToDismiss() { // проверяем разработчиков для увольнения
    // eslint-disable-next-line max-len
    const devsToDismiss = this.developers.filter((dev) => dev.getFreeDays() > 3);
    if (devsToDismiss.length) {
      // eslint-disable-next-line max-len
      devsToDismiss.sort((dev1, dev2) => dev1.getCountDoneProjects() - dev2.getCountDoneProjects());
      const dismissedDev = devsToDismiss.pop();
      this.boss.incDismissedDevs();
      this.developers = this.developers.filter((dev) => dev !== dismissedDev);
    }
  }

  distributeByDevs(projects) { // метод распределения проектов по разработчикам
    const freeDevs = this.developers.filter((dev) => dev.isFree());
    while (projects.length && freeDevs.length) {
      const dev = freeDevs.pop();
      dev.setProject();
      const proj = projects.pop();
      proj.incCountDevelopers();
      this.boss.joinDevToProj(dev, proj);
    }
    if (projects.length) { // если есть проекты для разработки которых нет ресурсов, то возвращаем их директору
      this.boss.addRemainingProjs(projects);
    }
  }
}

class Mobile extends Department {
  constructor() {
    super();
    this.name = 'mobile';
  }

  getName() {
    return this.name;
  }

  addDeveloper() { // шаблон фабричный метод(каждый отдел добавляет соответствующего разработчика)
    const dev = new Developer('mobile');
    this.developers.push(dev);
  }

  distributeByDevs(projects) { // метод распределения проектов по разработчикам
    const freeDevs = this.developers.filter((dev) => dev.isFree());
    while (projects.length && freeDevs.length) {
      const dev = freeDevs.pop();
      dev.setProject();
      const proj = projects.pop();
      proj.incCountDevelopers();
      this.boss.joinDevToProj(dev, proj);
      if (proj.getComplexity() > proj.getCountDevelopers()) { // если к проекту можно добавить разработчика, то пока оставляем проект
        projects.unshift(proj);
      }
    }
    if (projects.length) { // если есть проекты для разработки которых нет ресурсов, то возвращаем их директору
      // eslint-disable-next-line max-len
      const projectsToRemain = projects.filter((proj) => proj.getCountDevelopers() === 0);
      this.boss.addRemainingProjs(projectsToRemain);
    }
  }
}
class Qa extends Department {
  constructor() {
    super();
    this.name = 'qa';
  }

  addDeveloper() {
    const dev = new Developer('qa');
    this.developers.push(dev);
  }

  getName() {
    return this.name;
  }
}

class Web extends Department {
  constructor() {
    super();
    this.name = 'web';
  }

  addDeveloper() {
    const dev = new Developer('web');
    this.developers.push(dev);
  }

  getName() {
    return this.name;
  }
}

function simulate(days) {
  const manager = new EventManager('inc_day', 'generate');
  const company = new Company(manager);
  const boss = new Boss();
  const web = new Web();
  const mobile = new Mobile();
  const qa = new Qa();

  company.setBoss(boss);
  company.addDepartment(web);
  company.addDepartment(mobile);
  company.addDepartment(qa);

  for (let i = 0; i < days; i += 1) {
    company.generateNewProjs();
    company.incDay();
  }
  console.log(`Статистика за ${days} дней:`);
  console.log(`Выполнено проектов: ${company.getDoneProjects()};`);
  console.log(`Принято программистов: ${company.getEmployedDevs()};`);
  console.log(`Уволенно программистов: ${company.getDismissedDevs()}.`);
}

simulate(150);
