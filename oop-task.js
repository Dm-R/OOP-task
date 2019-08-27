class Company {
    constructor() {
        this._employedDevs = 0;// принятые программисты
        this._dismissedDevs = 0;// уволенные программисты
        this._doneProjects = 0;// кол-во выполненых проектов
        this._boss = null;// директор
        this._departments = [];//отделы
    }
    checkDevsToDismiss() {// проверяем есть ли программисты, которых можно уволить
        this._departments.forEach(function (dep) {
            dep.checkDevsToDismiss();
        })
    }
    checkProjects() {// прверяем проекты(готовые выполненые)
        this._departments.forEach((dep) => {
            dep.checkProjects();
        })
    }
    incDay() {//добавляем день
        this._departments.forEach(function (dep) {
            dep.incDay();
        })
    }
    addDepartment(dep) {//добавляем отдел
        if (dep instanceof Department) {
            this._departments.push(dep);
            dep.setBoss(this._boss);//устан. директора для отдела
            dep.setCompany(this);//устан. компанию для отдела
            this._boss[dep.name] = dep;//устан. отдел директору
        }
    }
    setBoss(boss) {//устан. директора для компании
        if (boss instanceof Boss) {
            this._boss = boss;
            this._boss.setCompany(this);
        }
    }
    incEmployedDevs() {// увеличиваем кол-во нанятых программистов
        this._employedDevs++;
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
    incDoneProjects(count) {//увеличиваем число выполненых проектов на COUNT штук
        this._doneProjects += count;
    }
    getDoneProjects() {
        return this._doneProjects;
    }
}

class Boss {
    constructor() {
        this.remainingProjects = new Array();
        this.web = null;
        this.mobile = null;
        this.qa = null;
        this.projectsToTest = [];
        this.doneProjects = [];
        this._newProjects = [];
        this._devsToDismiss = [];
        this._company = null;
    }
    setCompany(company) {// устан. компанию 
        this._company = company;
    }
    setNewProjects(newProj) {// устан новые проекты
        this._newProjects = newProj;
    }
    addRemainingProjs(projects) {// добавляем оставшийся проект
        this.remainingProjects = this.remainingProjects.concat(projects);
    }
    distrProjects() {//распределяем проекты
        //если есть вчерашние проекты распределяем их, иначе распределяем новые
        var projectsToDistr = this.remainingProjects.length > 0 ? this.remainingProjects : this._newProjects;
        var webProjects = projectsToDistr.filter(function (project) {
            return project.getType() === 'web';
        });
        if (webProjects.length) {
            this.web.distributeByDevs(webProjects);
        }
        var mobProjects = projectsToDistr.filter(function (project) {
            return project.getType() === 'mobile';
        });
        if (mobProjects.length) {
            this.mobile.distributeByDevs(mobProjects);
        }
        if (this.projectsToTest.length) {
            var projects = this.projectsToTest;
            this.qa.distributeByDevs(projects);
        }
        //если распределяли вчерашние проекты, то удаляем их из оставшихся
        if (projectsToDistr == this.remainingProjects) {
            this.remainingProjects.length = 0;
        }
    }
    addProjectToTest(project) {//добавляем проект готовый к тестированию
        this.projectsToTest.push(project);
    }
    addDoneProject(project) {//добавляем выполненый проект
        this.doneProjects.push(project);
    }
    deleteDoneProjects() {//удаляем выполненые проекты
        this._company.incDoneProjects(this.doneProjects.length);
        this.doneProjects.forEach(function (dProj) {
            dProj.developers.forEach((dev) => {
                dev.incCountDoneProjects();
                dev.setProject(null);
            });
        })
        this.doneProjects.length = 0
    }
    employDevs() {// нанимаем новых программистов для реализации оставшихся проектов
        this.remainingProjects.forEach((rProj) => {
            switch (rProj.getType()) {
                case 'web': this.web.addDeveloper(new Developer('web'));
                    break;
                case 'mobile': this.mobile.addDeveloper(new Developer('mobile'));
                    break;
                case 'qa': this.qa.addDeveloper(new Developer('qa'));
            }
        })
    }
}

class Project {
    constructor() {
        this._complexity = Math.floor(Math.random() * 3 + 1);  //сложность проекта
        this._type = Math.floor(Math.random() * 2 + 1) == 1 ? 'web' : 'mobile';  //тип проекта
        this.developers = [];  // разработчики проекта
        this.daysOfDevelopment = 0;//текущее кол-во дней на разработке
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
    setDeveloper(dev) {//устан. программиста для проекта
        this.developers.push(dev);
    }
    getTimeToDo() {// количество дней для выполнения проекта 
        return Math.ceil(this._complexity / this.developers.length);
    }
}
class Developer {
    constructor(profession) {
        this.profession = profession;//специальность
        this._project = null;//проект
        this.freeDays = 0;//кол-во свободных дней
        this._countDoneProjects = 0;//кол-во готовых проектов
    }
    getProject() {
        return this._project;
    }
    setProject(proj) {//устан. проект для программиста
        this._project = proj;
        this.freeDays = 0;
    }
    incFreeDays() {// увеличиваем свободные дни
        this.freeDays++;
    }
    incCountDoneProjects() {//увеличиваем число готовых проектов
        this._countDoneProjects++;
    }
    getCountDoneProjects() {
        return this._countDoneProjects;
    }
}
class Department {
    constructor(name) {
        this.name = name;//название
        this.developers = [];//разработчики
        this.projects = [];//проекты на разработке
        this._boss = null;//директор
        this._company = null;//компания
    }
    setBoss(boss) {//устан. директора
        if (boss instanceof Boss) {
            this._boss = boss;
        }
    }
    setCompany(company) {
        this._company = company;
    }
    joinDevToProj(dev, proj) {//устан. проекта программисту и наоборот
        dev.setProject(proj);
        proj.setDeveloper(dev);
    }
    addDeveloper(dev) {// добавляем программиста
        this.developers.push(dev);
        this._company.incEmployedDevs();
    }
    distributeByDevs(projects) {  //метод распределения проектов по разработчикам
        for (var dev = 0; dev < this.developers.length; dev++) {
            if (projects.length) {
                if (this.developers[dev].getProject() === null) {
                    var project = projects.pop();
                    this.joinDevToProj(this.developers[dev], project);
                    this.projects.push(project);  //проекты принятые на разработку
                }
            } else {
                break;
            }
        }
        if (projects.length) {//если есть проекты для разработки которых нет ресурсов, то возвращаем их директору
            this._boss.addRemainingProjs(projects);
        }
    }
    checkDevsToDismiss() { //проверяем разработчиков(увольнение)          
        if (this.developers.length) {
            var isToDismiss = false;
            var index = 0;
            var min = this.developers[0];
            this.developers.forEach(function (dev, ind) {
                if (dev.freeDays >= 3) {
                    if (dev.getCountDoneProjects() < min.getCountDoneProjects()) {
                        min = dev;
                        index = ind;
                        isToDismiss = true;
                    }
                }
            });
            if (isToDismiss) {
                delete this.developers[index];
                this.developers = this.developers.filter((dev) => {
                    return (dev !== 'undefined');
                })
                this._company.incDismissedDevs();
            }
        }
    }
    checkProjects() {//проверяем проекты(готов или нет)
        if (this.projects.length) {
            this.projects.forEach((proj, ind) => {
                if (proj.daysOfDevelopment == proj.getTimeToDo()) {
                    proj.daysOfDevelopment = 0;
                    proj.setType('qa');
                    this._boss.addProjectToTest(proj);
                    delete this.projects[ind];
                }
            });
            this.projects = this.projects.filter((proj) => {
                return proj !== 'undefined';
            })
        }
    }
    incDay() {//увеличиваем день
        if (this.developers.length) {
            this.developers.forEach(function (dev) {
                if (dev.getProject() === null) {
                    dev.incFreeDays();
                }
            });
        }
        if (this.projects.length) {
            this.projects.forEach(function (proj) {
                proj.daysOfDevelopment++;
            });
        }
    }
}
class Mobile extends Department {
    constructor(name) {
        super(name);
        this.freeDevelopers = [];
    }
    distributeByDevs(projects) {//распределяем проекты по разработчикам
        super.distributeByDevs(projects);//из родительского класса пытаемся распределить по одному разработчику на проект
        //если остались свободные разработчики пытаемся распределить их по проектам сложность которых выше 1
        this.freeDevelopers = this.developers.filter(function (developer) {  //свободные программисты
            return developer.getProject() === null;
        });
        if (this.freeDevelopers.length != 0) {
            var difficultProjects = this.projects.filter(function (pro) {  //Проекты к которым можно добавить программиста
                return pro.getComplexity() > pro.developers.length;
            });
            while (this.freeDevelopers.length && difficultProjects.length) {
                for (var proj = 0; proj < this.projects.length; proj++) {
                    if (this.projects[proj].getComplexity() > this.projects[proj].developers.length) {
                        if (this.freeDevelopers.length > 0) {  // если есть свободные программисты, то присоединяем одного из них(последнего
                            this.joinDevToProj(this.freeDevelopers.pop(), this.projects[proj]);  // в массиве - метод POP()) к текущему проекту 
                        }  // иначе прерываем цикл
                        else {
                            break;
                        }
                    }
                }
                difficultProjects = this.projects.filter(function (pro) {
                    return pro.getComplexity() > pro.developers.length;
                });
            }
        }
    }
}
class Qa extends Department {
    constructor(name) {
        super(name);
    }
    checkProjects() {//проверяем проекты(завершен или нет)
        this.projects.forEach((proj) => {
            if (proj.daysOfDevelopment == 1) {
                this._boss.addDoneProject(proj);
            }
        });
    }
}

function simulate(days) {
    var company = new Company();
    var boss = new Boss();
    var web = new Department('web');
    var mobile = new Mobile('mobile');
    var qa = new Qa('qa');
    var countNewProj = 0;
    var newProj = [];

    company.setBoss(boss);
    company.addDepartment(web);
    company.addDepartment(mobile);
    company.addDepartment(qa);

    for (var i = 0; i < days; i++) {
        if (boss.remainingProjects.length) {
            boss.employDevs();
            boss.distrProjects();
        }
        countNewProj = Math.floor((Math.random() * 4) + 1);
        newProj = [];
        for (var j = 0; j < countNewProj; j++) {
            newProj.push(new Project());
        }
        boss.setNewProjects(newProj);
        company.checkProjects();
        if (boss.doneProjects.length) {
            boss.deleteDoneProjects();
        }
        boss.distrProjects();
        company.checkDevsToDismiss();
        company.incDay();
    }
    console.log(`Выполнено проектов: ${company.getDoneProjects()}, принято программистов: ${company.getEmployedDevs()}, уволенно программистов: ${company.getDismissedDevs()}.`);
}