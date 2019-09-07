class EventManager {//класс для создания менеджеров событий
    constructor(...events) {
        this.listeners = new Map();
        for (let event of events) {
            this.listeners.set(event, new Array());
        }
    }
    subscribe(event, ...listeners) {// подписать на событие
        for (let listener of listeners) {
            this.listeners.get(event).push(listener);
        }
    }
    unsubscribe(event, listener) {//отписать от события
        let listeners = this.listeners.get(event).filter((curent) => { return curent !== listener });
        this.listeners.set(event, listeners);
    }
    notify(event, data) {//уведомить подписчиков
        this.listeners.get(event).forEach(listener => listener.update(data));
    }
}

class Company {
    constructor(manager) {
        this.eventManager = manager;//менеджер событий(шаблон наблюдатель - издатель будет опевещать подписчиков о событиях)
        this._employedDevs = 0;// принятые программисты
        this._dismissedDevs = 0;// уволенные программисты
        this._doneProjects = 0;// кол-во выполненых проектов
        this._departments = [];
        this._newProjects = [];
        this._boss = null;
    }
    unsubscribe(event, listener) {//метод для отписывания подписчика события
        this.eventManager.unsubscribe(event, listener);
    }
    setBoss(boss) {
        if (boss instanceof Boss) {
            this._boss = boss;
            this._boss.setCompany(this);
            this._departments.forEach(dep => {
                dep.setBoss(boss);
                this._boss.addDepartment(dep);
            });
            this.eventManager.subscribe('generate', this._boss);
        }
    }
    generateNewProjs() {//омпания получает новые проекты
        let countNewProj = Math.floor((Math.random() * 4) + 1);
        for (var j = 0; j < countNewProj; j++) {
            this._newProjects.push(new Project(this._boss));
        }
        this.eventManager.subscribe('inc_day', ...this._newProjects);//подписываем проекты на событие 'inc_day' - увеличение дня
        this.eventManager.notify('generate', this._newProjects);//уведомляем директора о новых проектах
        this._newProjects = [];//сбрасываем новые проекты
    }
    incDay() {//добавляем день               
        this.eventManager.notify('inc_day', null);//уведомляем подписчиков
    }
    incEmployedDevs() {// увеличиваем кол-во нанятых программистов
        this._employedDevs++;
    }
    addDepartment(dep) {//добавляем департамент
        this._departments.push(dep);
        this._boss.addDepartment(dep);
        dep.setBoss(this._boss);
        this.eventManager.subscribe('inc_day', dep);//подписываем департамент на событие
    }
    getEmployedDevs() {
        return this._employedDevs;
    }
    incDismissedDevs() {//увеличиваем кол-во уволенных программистов
        this._dismissedDevs++;
    }
    getDismissedDevs() {
        return this._dismissedDevs;
    }
    incDoneProjects() {//увеличиваем число выполненых проектов на 1
        this._doneProjects++;
    }
    getDoneProjects() {
        return this._doneProjects;
    }
}

class Boss {//директор выступит в качестве посредника
    constructor() {
        this._projsInDevelopment = new Map();//коллекция для группировки проектов с разработчиками(ключ - проект, значение ключа - разработчики)
        this.remainingProjects = new Array();
        this._departments = [];
        this.projectsToTest = [];
        this._company = null;
    }
    setCompany(company) {
        this._company = company;
    }
    joinDevToProj(dev, proj) {//добавляем разработчика к проекту
        proj.stopWaiting();
        if (this._projsInDevelopment.has(proj)) {//если уже есть такой проект, то просто добавляем разработчика
            this._projsInDevelopment.get(proj).push(dev);
        } else {// иначе создаем новую пару
            this._projsInDevelopment.set(proj, [dev])
        }
    }
    incDismissedDevs() {
        this._company.incDismissedDevs();
    }
    removeProject(proj) {//удаляем проект
        let devs = this._projsInDevelopment.get(proj);
        devs.forEach(dev => {
            dev.setFree();
        });
        this._projsInDevelopment.delete(proj);
        this._company.unsubscribe('inc_day', proj);//отписываем от события
        this._company.incDoneProjects();
    }
    addDepartment(dep) {
        this._departments.push(dep);
    }
    addRemainingProjs(projects) {// добавляем оставшийся проект
        projects.forEach(proj => proj.wait());
        this.remainingProjects = this.remainingProjects.concat(projects);
    }
    update(data) {//обрабатываем оповешение о событие
        if (this.remainingProjects.length) {//если есть оставшиеся проекты, то 
            this.employDevs();// нанимаем новых разработчиков
            this.distrProjects(this.remainingProjects);
            this.remainingProjects = [];
        }
        let projects = data.concat(this.projectsToTest);//распределяем новые проекты и проекты для тестирования
        this.projectsToTest = [];
        this.distrProjects(projects);
    }
    distrProjects(projectsToDistr) {//распределяем проекты
        this._departments.forEach(dep => {
            let projects = projectsToDistr.filter(proj => { return proj.getType() == dep.getName() });
            dep.distributeByDevs(projects);
        });
    }
    addProjectToTest(project) {//добавляем проект готовый к тестированию
        this.projectsToTest.push(project);
    }
    employDevs() {// нанимаем новых программистов для реализации оставшихся проектов
        this._departments.forEach(dep => {
            let projects = this.remainingProjects.filter(rProj => { return rProj.getType() == dep.getName() });
            projects.forEach(() => dep.addDeveloper());//шаблон фабричный метод(добавит каждому отделу соответствующего разработчика)
            this._company.incEmployedDevs();
        })
    }
}

class Project {
    constructor(boss) {
        this._boss = boss;//директор - посредник
        this._complexity = Math.floor(Math.random() * 3 + 1);  //сложность проекта
        this._type = Math.floor(Math.random() * 2 + 1) == 1 ? 'web' : 'mobile';  //тип проекта
        this._daysOfDevelopment = 0;//текущее кол-во дней на разработке
        this._countDevs = 0;
        this._isWaiting = true;//есле не поступил на разработку, то не будет увеличивать текущее кол-во дней на разработке при оповещении
    }
    wait() {//
        this._isWaiting = true;
    }
    stopWaiting() {
        this._isWaiting = false;
    }
    isWaiting() {
        return this._isWaiting;
    }
    getComplexity() {
        return this._complexity;
    }
    getType() {
        return this._type;
    }
    setType(type) {
        this._type = type;
    }
    incCountDevelopers() {//увеличить число программистов разрабатывающих проект
        this._countDevs++;
    }
    getCountDevelopers() {
        return this._countDevs;
    }
    getTimeToDo() {// количество дней для выполнения проекта 
        return Math.ceil(this._complexity / this._countDevs);
    }
    update() {//обрабатываем оповешение от издателя
        if (this.isWaiting() === false) {
            this._daysOfDevelopment++;
            if (!(this.getType() == 'qa')) {
                if (this.getTimeToDo() == this._daysOfDevelopment) {
                    this.setType('qa');
                    this.wait();//ожидает тестировщика
                    this._daysOfDevelopment = 0;
                    this._boss.addProjectToTest(this);
                }
            } else {
                if (this._daysOfDevelopment == 1) {
                    this._boss.removeProject(this);//удаляем готовый проект
                }

            }
        }
    }
}
class Developer {
    constructor(profession) {
        this.profession = profession;//специальность
        this._freeDays = 0;//кол-во свободных дней
        this._countDoneProjects = 0;//кол-во готовых проектов
        this._isFree = true;//занят или нет
    }
    incDay() {// увеличиваем свободные дни
        if (this.isFree()) {
            this._freeDays++;
        }
    }
    setProject() {
        this._isFree = false;
        this._freeDays = 0;
    }
    setFree() {
        this._isFree = true;
        this._countDoneProjects++;
    }
    getCountDoneProjects() {
        return this._countDoneProjects;
    }
    isFree() {
        return this._isFree;
    }
    getFreeDays() {
        return this._freeDays;
    }
}
class Department {
    constructor() {
        this.developers = [];//разработчики
        this.projects = [];//проекты на разработке
        this._boss = null;
    }
    setBoss(boss) {
        this._boss = boss;
    }
    update() {  //обрабатываем оповещение от издателя             
        this.checkDevsToDismiss();
        this.developers.forEach(dev => dev.incDay());
    }

    checkDevsToDismiss() {//проверяем разработчиков для увольнения
        let devsToDismiss = this.developers.filter(dev => { return dev.getFreeDays() > 3 });
        if (devsToDismiss.length) {
            devsToDismiss.sort((dev1, dev2) => { return dev1.getCountDoneProjects() - dev2.getCountDoneProjects() });
            let dismissedDev = devsToDismiss.pop();
            this._boss.incDismissedDevs();
            this.developers = this.developers.filter(dev => dev !== dismissedDev);
        }
    }

    distributeByDevs(projects) {  //метод распределения проектов по разработчикам
        let freeDevs = this.developers.filter(dev => { return dev.isFree() });
        while (projects.length && freeDevs.length) {
            let dev = freeDevs.pop();
            dev.setProject();
            let proj = projects.pop();
            proj.incCountDevelopers();
            this._boss.joinDevToProj(dev, proj);
        }
        if (projects.length) {//если есть проекты для разработки которых нет ресурсов, то возвращаем их директору
            this._boss.addRemainingProjs(projects);
        }
    }
}

class Mobile extends Department {
    constructor() {
        super();
        this.freeDevelopers = [];
    }
    getName() {
        return 'mobile';
    }
    addDeveloper() {//шаблон фабричный метод(каждый отдел добавляет соответствующего разработчика)
        let dev = new Developer('mobile');
        this.developers.push(dev);
    }
    distributeByDevs(projects) {  //метод распределения проектов по разработчикам
        let freeDevs = this.developers.filter(dev => { return dev.isFree() });
        while (projects.length && freeDevs.length) {
            let dev = freeDevs.pop();
            dev.setProject();
            let proj = projects.pop();
            proj.incCountDevelopers();
            this._boss.joinDevToProj(dev, proj);
            if (proj.getTimeToDo() > proj.getCountDevelopers()) {//если к проекту можно добавить разработчика, то пока оставляем проект
                projects.unshift(proj);
            }
        }
        if (projects.length) {//если есть проекты для разработки которых нет ресурсов, то возвращаем их директору
            let projectsToRemain = projects.filter(proj => { return proj.getCountDevelopers() == 0 });
            this._boss.addRemainingProjs(projectsToRemain);
        }
    }
}
class Qa extends Department {
    addDeveloper() {
        let dev = new Developer('qa');
        this.developers.push(dev);
    }
    getName() {
        return 'qa';
    }
}

class Web extends Department {
    addDeveloper() {
        let dev = new Developer('web');
        this.developers.push(dev);
    }
    getName() {
        return 'web';
    }
}

function simulate(days) {
    var manager = new EventManager('inc_day', 'generate');
    var company = new Company(manager);
    var boss = new Boss();
    var web = new Web();
    var mobile = new Mobile();
    var qa = new Qa();

    company.setBoss(boss);
    company.addDepartment(web);
    company.addDepartment(mobile);
    company.addDepartment(qa);

    for (var i = 0; i < days; i++) {
        company.generateNewProjs();
        company.incDay();
    }
    console.log(`Статистика за ${days} дней:`)
    console.log(`Выполнено проектов: ${company.getDoneProjects()};`);
    console.log(`Принято программистов: ${company.getEmployedDevs()};`);
    console.log(`Уволенно программистов: ${company.getDismissedDevs()}.`);

}

simulate(150);