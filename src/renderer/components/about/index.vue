<template>
  <div class="about-dialog">
    <el-dialog
      :visible.sync="showAboutDialog"
      :show-close="false"
      :modal="true"
      custom-class="ag-dialog-table"
      width="400px"
    >
      <img class="logo" :src="logo" />
      <el-row>
        <el-col :span="24">
          <h3 class="title">{{ name }}</h3>
        </el-col>
        <el-col :span="24">
          <div class="text">{{ appVersion }}</div>
        </el-col>
        <el-col :span="24">
          <div class="text" style="font-size: 13px; opacity: 0.8; margin-bottom: 15px; padding: 0 20px; line-height: 1.4;">
            A next generation markdown editor, originally based on the MarkText project.
          </div>
        </el-col>
        <el-col :span="24">
          <div class="text" style="font-size: 12px; line-height: 1.6; min-height: auto">{{ copyrightLuoRan }}</div>
        </el-col>
        <el-col :span="24">
          <div class="text" style="font-size: 12px; line-height: 1.6; min-height: auto">{{ copyrightMarkText }}</div>
        </el-col>
        <el-col :span="24">
          <div class="text" style="font-size: 12px; line-height: 1.6; min-height: auto; margin-top: 8px; font-weight: 500;">{{ copyrightGalileo }}</div>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import bus from '../../bus'
import BlanksLogo from '../../assets/images/logo.png'

export default {
  data () {
    const currentYear = new Date().getFullYear()
    this.name = 'Blanks'
    this.copyrightLuoRan = `Copyright © 2017-${currentYear} Luo Ran`
    this.copyrightMarkText = `Copyright © 2018-${currentYear} MarkText Contributors`
    this.copyrightGalileo = 'Modified and maintained as Blanks by GalileoLion since 2026'
    this.logo = BlanksLogo
    return {
      showAboutDialog: false
    }
  },
  computed: {
    ...mapState({
      appVersion: state => state.appVersion
    })
  },
  created () {
    bus.$on('aboutDialog', this.showDialog)
  },
  beforeDestroy () {
    bus.$off('aboutDialog', this.showDialog)
  },
  methods: {
    showDialog () {
      this.showAboutDialog = true
      bus.$emit('editor-blur')
    }
  }
}
</script>

<style>
  .about-dialog el-row,
  .about-dialog el-col {
    display: block;
  }

  .about-dialog img.logo {
    width: 80px;
    height: 80px;
    display: inherit;
    margin: 0 auto;
  }

  .about-dialog .title,
  .about-dialog .text {
    min-height: 32px;
    text-align: center;
  }

  .about-dialog .title {
    color: var(--floatFontColor);
  }

  .about-dialog .text {
    color: var(--floatFontColor);
  }
</style>
