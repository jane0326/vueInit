class Compile{
    constructor(el,vm) {
        this.$vm = vm;
        this.$el = document.querySelector(el);
        /*
           获取根节点内部的内容
        */
        this.$fragment = this.nodeToFragment(this.$el);
        //编译
        this.compileElement(this.$fragment);
        //将原本是用vue语法编写的<template />里的内容编译成js能识别的代码，并挂载的真实的dom元素上
        this.$el.appendChild(this.$fragment);//将 this.$fragment挂载到根节点上
    }

    nodeToFragment(el){
        //1、生成document碎片，将所有标签处理成数组
        let fragment = document.createDocumentFragment();
        let child;
        while(child = el.firstChild){
            fragment.appendChild(child);
        }
        return fragment;
    }
    compileElement(el){
        /*
         1、生成document碎片，将所有标签处理成数组
         2、遍历每一个标签，
               判断属性有没有k-开头的
              判断内容{{}}，触发这个getter方法

       */
        let childNodes = el.childNodes;
        Array.from(childNodes).forEach((node)=>{
            let text = node.textContent;
            let reg = /\{\{(.*)\}\}/;
            if(this.isElementNode(node)){
                //如果是一个标签
                this.compile(node);
            }else if(this.isTextNode(node) && reg.test(text)){
                //文本节点，且包含{{}}
                this.compileText(node,RegExp.$1);
            }
            if(node.childNodes && node.childNodes.length){
                this.compileElement(node);
            }
        })
    }
    //标签
    compile(node){
        let attrs = node.attributes;
        Array.from(attrs).forEach((attr)=>{
            let attrName = attr.name;
            let key = attr.value;
            //是k-开头的双向绑定
            if(this.isVueDirective(attrName)){
                console.log('vue的变量',attrName);
                const dir = attrName.slice(2);
                if(this[dir]){
                    this[dir](node,this.$vm,key)
                }
            }
            //@开头的事件
            if(this.isVueEvent(attrName)){
                console.log('vue的事件',attrName);
                const action = attrName.substring(1);
                this.eventHandler(node,this.$vm,key,action)
            }
        })
    }
    //文本
    compileText(node,key){
        console.log('文本替换 并且可以收集依赖',node, key)
        this.text(node,this.$vm,key);
    }
    eventHandler(node,vm,key,action){
        const fn = vm.$options.methods && vm.$options.methods[key];
        node.addEventListener(action,fn.bind(vm),false)
    }
    update(node,vm,key,dir){
        const fn = this[dir+'Updater'];
        fn && fn(node,vm[key]);
        new Watcher(vm,key,value=>{
            fn && fn(node,value);
        });
    }
    textUpdater(node,value){
        node.textContent = value;
    }
    htmlUpdater(node,value){
        node.innerHTML =  value;
    }
    modelUpdater(node,value){
        //修改数据时，同时修改视图
        node.value = value;
    }
    text(node,vm,key){
        this.update(node,vm,key,'text');
    }
    html(node,vm,key){
        this.update(node,vm,key,'html');
    }
    model(node,vm,key){
        this.update(node,vm,key,'model');
        //双向数据绑定，修改视图同时修改data
        node.addEventListener('input',e=>{
            const newValue = e.target.value;
            vm[key] = newValue;
        })
    }
    isVueDirective(name){
        return name.indexOf('k-') == 0;
    }
    isVueEvent(name){
        return name.indexOf('@') == 0;
    }
    isTextNode(node){
        return node.nodeType === 3;
    }
    isElementNode(node){
        return node.nodeType === 1;
    }
}