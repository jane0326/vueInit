
//依赖收集，收集目标的观察者（依赖）
class Dep{
    constructor(){
      this.deps = [];
    }
    //添加依赖
    addDep(target){
        this.deps.push(target);
    }
    //通知依赖更新
    notify(){
        this.deps.forEach((item)=>{
            //执行更新函数
            item.update();
        })
    }
};
Dep.target = null;
//监听器，订阅者，Dep依赖收集通知订阅者，执行对应操作
class Watcher{
    constructor(vm,key,cb){
        // Dep.target = this;
        this.vm = vm;
        this.key = key;
        this.cb = cb;
        // this.value = vm.$data[key];
        this.value = this.get();
    }
    get(){
        //将Dep的指向，设置为watcher
        Dep.target = this;
        let value = this.vm[this.key];
        // this.vm.$data[this.key];
        Dep.target = null;
        return value;
    }
    update(){
        let value = this.vm[this.key];
        //监控到事件被触发后，执行对应的回掉函数
        console.log('视图需要更新，监听器收到');
        this.cb.call(this.vm,value);
    }
}
class KVue{
    constructor(options){
        this.$options = options;
        this.$data = options.data;
        //将数据data变成可观察（observable）的，响应式的
        this.observer(this.$data);
        //设置$data在this上的依赖
        this.proxy(this.$data);
        // new Watcher();
        // console.log('模拟render，触发data对象的getter方法',this.name);
        if(options.el){
            this.$compile = new Compile(options.el,this);
        }
        if(this.$options.created){
            this.$options.created.call(this);
        }
    }
    //给数据data对象的属性，设置成响应式
    observer(obj){
        Object.keys(obj).forEach((key)=>{
            this.defineReactive(obj,key,obj[key]);
        })
    }
    //给对象设置属性
    defineReactive(obj,key,val){
        //给data的每一个属性，设置一个依赖收集
       const dep = new Dep();
       Object.defineProperty(obj,key,{
           //getter方法进行依赖收集,
           //在发布/订阅模式中，get是给data的属性添加订阅者（监听数据变化）；
           // set改变data里的数据，是数据的观察者，从而触发 发布者去发布东西，并通知具体的订阅者做更新视图
           get(){
               console.log('get数据，将Watcher添加到依赖里');
               /*Watcher对象存在全局的Dep.target中,Dep.target指向的就是Watcher，在创建新的Watcher时，将Dep的target属性指向它*/
               Dep.target && dep.addDep(Dep.target);
               return val
           },
           //setter方法进行监听数据的变化，每一个setter就是一个观察者，在数据变更的时候通知订阅者更新视图
           set(newValue){
               console.log('set数据，通知依赖去更新');
               val = newValue;
               dep.notify();//
           }
       });
       //将data的属性绑定到vm上
       // this.vm[key] = val;
    }
    proxy(obj){
        Object.keys(obj).forEach((key)=>{
            Object.defineProperty(this,key,{
                get(){
                    return this.$data[key];
                },
                set(newValue){
                    this.$data[key] = newValue;
                }
            })
        })
    }
}