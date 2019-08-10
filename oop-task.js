
        //Функция для создания объекта - директор
        function Boss() {
            var remainingProjects = [];//проекты которые не удалось передать в отделы

            //как вариант рассматривался такой способ перисвоить проекты разработчикам, но это не совсем
            //задача директора и к тому же, данный вариант необходимо допполнять т. к. mobile разработчики
            //могут работать совместно.
            /*this.distributeByDepartments = function (projects, web, mobile) {
                for (var i = 0; i < projects.length; i++) {
                    switch (projects[i].type) {
                        case 'web': if (web.developers.length > 0) {
                            for (var j = 0; dev < web.developers.length; j++) {
                                if (web.developers[j].project === null) {
                                    web.developers[j].project = projects[i];
                                    projects[i].developer = web.developers[j];
                                    break;
                                }
                            }
                        }
                        case 'mobile': if (mobile.developers.length > 0) {
                            for (var m = 0; dev < mobile.developers.length; m++) {
                                if (mobile.developers[m].project === null) {
                                    mobile.developers[m].project = projects[i];
                                    projects[i].developer = mobile.developers[m];
                                    break;
                                }
                            }
                        }
                    }
                }
            }*/
            // метод для найма новых сотрудников
            //Не совсем понятен механизм найма QA специалистов(набирать сразу по кол-ву пректов или создать отдельный метод который будет принимать
            //от отделов подготовленные для тестирования проекты и исходя из них уже набирать сотрудников)
            function employDevelopers(web, mobile) {
                for (var i = 0; i < remainingProjects.length; i++) {
                    switch (remainingProjects[i].type) {
                        case 'web': web.developers.push(new Developer('web'));
                            break;
                        case 'mobile': mobile.developers.push(new Developer('mobile'));
                            break;
                    }
                }
            }
            //метод распределения проектов по отделам
            this.distributeByDepartments = function (projects, web, mobile) {
                var webProj = projects.filter(function (proj) {//web проекты
                    return proj.getType() == 'web';
                });
                var mobProj = projects.filter(function (proj) {//mob проекты
                    return proj.getType() == 'mobile';
                });
                var freeWeb = web.developers.filter(function (dev) {//кол-во свободных web программистов
                    return dev.getProject() === null
                }).length;
                web.newProj = webProj.slice(0, freeWeb);//передача в web-отдел
                var freeMob = mobile.developers.filter(function (dev) {//кол-во свободных mob программистов
                    return dev.getProject() === null
                }).length;
                mobile.newProj = mobProj.slice(0, freeMob);//передача в mob-отдел
                remainingProjects = webProj.slice(freeWeb).concat(mobProj.slice(freeMob));//оставшиеся проекты
            }

        }
        //Функция для создания разработчиков
        function Developer(profession) {
            this.profession = profession;
            var project = null;//переменная для пртсвоения проекта разработчику
            var doneProjects = 0;//готовые проекты
            var freeDays = 0;//свободные дни (для увольнения)
            this.setProject = function (proj) {//присвоить проект и сбросить свободные дни
                project = proj;
                freeDays = 0;
            }
            this.addDoneProject = function () {//увеличить на один готовый проект
                doneProjects++;
            }
            this.getDoneProjects = function () {
                return doneProjects;
            }
            this.incFreeDays = function () {//если не получил проект увеличить кол-во свободных дней
                freeDays++;
            }
            this.getFreeDays = function () {
                return freeDays;
            }
            this.getProject = function () {
                return project;
            }
        }
        // Функция для создания проектов
        function Project() {
            var complexity = Math.floor(Math.random() * 3 + 1);//сложность проекта
            var type = Math.floor(Math.random() * 2 + 1) == 1 ? 'web' : 'mobile';//тип проекта
            this.done = false;//прошел проверку или нет
            this.countDevs = 0;//кол-во работающих над проектом разработчиков
            this.developer = null;///можно создать переменную которая будет ссылаться на разработчика,
            //чтобы когда проект пройдет тестирование разработчику установить NULL в поле project(показать что он свободен)
            this.getComplexity = function () {
                return complexity;
            };
            this.getType = function () {
                return type;
            }
        }
        //Функция для создания отделов
        //На мой взгляд этот класс должен быть общим для всех отделов, а далее необходимо создать отдельно классы Mobile & QA так как
        // у них должен быть расширен функционал, т. е. mobile может распределять один проект между несколькими разработчиками, Qa отдел тоже как то должен "запрашивать"
        //новых тестировщиков (или директор нанимает их заранее, когда получает новыее проекты, не совсем яснен данный момент)
        function Department(name) {
            var self = this;
            this.name = name;
            this.newProj = [];
            this.developers = [];//массив для хранения разработчиков
            this.distrituteByDev = function () {//метод распределения проектов по разработчикам
                this.newProj.forEach(function (project) {//в цикле перебирается каждый проект, и если для него есть свободный программист, то он присваивается
                    //программисту и наоборот
                    for (var j = 0; j < self.developers.length; j++) {
                        self.developers[j].setProject(project);
                        project.developer = self.developers[j];
                    }
                });
            }
        };

        function Company(name) {
            this.name = name;
            var employedDevelopers = 0;//нанятые сотрудники
            var dismissedDevelopers = 0;//уволенные сотрудники
            var doneProjects = 0;//кол-во реализованных компанией проектов
            var boss = new Boss();//директор
            //отделы
            var webDepartment = new Department('web');
            var mobileDepartment = new Department('mobile');
            var qaDepartment = new Department('qa');
            this.work = function (countDays) {
                //метод для расчета проектов нанятых и уволенных сотрудников
                //пока не реализован
                return `Реализованно: ${doneProjects}; принято ${employedDevelopers} программистов; уволенно ${dismissedDevelopers}.`;
            }

        }
