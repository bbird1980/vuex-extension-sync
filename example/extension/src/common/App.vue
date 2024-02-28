<template>
    <h1>{{ title }} counter: {{ counter }}</h1>
    <button @click="click">Click me</button>
</template>

<script>
import {mapState} from 'vuex';
import store from './store.js';

export default {
    props: {
        title: String,
    },
    computed: {
        ...mapState(['counter']),
    },
    methods: {
        click() {
            store.commit('COUNTER');
        }
    }
};
</script>

<style>
</style>
